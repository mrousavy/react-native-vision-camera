//
// Created by Marc Rousavy on 25.08.23.
//

#include "VideoPipeline.h"
#include "OpenGLError.h"

#include <android/native_window_jni.h>
#include <GLES2/gl2.h>
#include <GLES2/gl2ext.h>
#include <EGL/egl.h>

namespace vision {

jni::local_ref<VideoPipeline::jhybriddata> VideoPipeline::initHybrid(jni::alias_ref<jhybridobject> jThis) {
  return makeCxxInstance(jThis);
}

VideoPipeline::VideoPipeline(jni::alias_ref<jhybridobject> jThis): _javaPart(jni::make_global(jThis)) { }

VideoPipeline::~VideoPipeline() {
  // 1. Remove output surfaces
  removeFrameProcessorOutputSurface();
  removeRecordingSessionOutputSurface();
  removePreviewOutputSurface();
  // 2. Delete the pass-through shader
  if (_vertexBuffer != NO_BUFFER) {
    glDeleteBuffers(1, &_vertexBuffer);
    _vertexBuffer = NO_BUFFER;
  }
  // 3. Delete the input textures
  if (_inputTextureId != NO_TEXTURE) {
    glDeleteTextures(1, &_inputTextureId);
    _inputTextureId = NO_TEXTURE;
  }
  if (_offscreenFrameBuffer != NO_FRAME_BUFFER) {
    glDeleteFramebuffers(1, &_offscreenFrameBuffer);
    _offscreenFrameBuffer = NO_FRAME_BUFFER;
  }
  // 4. Destroy the OpenGL context
  if (_context != nullptr) {
    _context->destroy();
  }
}

void VideoPipeline::setSize(int width, int height) {
  _width = width;
  _height = height;
}

void VideoPipeline::removeFrameProcessorOutputSurface() {
  if (_frameProcessorOutput.surface != nullptr) {
    ANativeWindow_release(_frameProcessorOutput.surface);
    _frameProcessorOutput = {
        .surface = nullptr,
        .width = 0,
        .height = 0
    };
  }
}

void VideoPipeline::setFrameProcessorOutputSurface(jobject surface) {
  // 1. Delete existing output surface
  removeFrameProcessorOutputSurface();

  // 2. Set new output surface if it is not null
  _frameProcessorOutput = {
      .surface = ANativeWindow_fromSurface(jni::Environment::current(), surface),
      .width = _width,
      .height = _height
  };
}

void VideoPipeline::removeRecordingSessionOutputSurface() {
  if (_recordingSessionOutput.surface != nullptr) {
    ANativeWindow_release(_recordingSessionOutput.surface);
    _recordingSessionOutput = {
        .surface = nullptr,
        .width = 0,
        .height = 0
    };
  }
}

void VideoPipeline::setRecordingSessionOutputSurface(jobject surface, jint width, jint height) {
  // 1. Delete existing output surface
  removePreviewOutputSurface();

  // 2. Set new output surface if it is not null
  _previewOutput = {
      .surface = ANativeWindow_fromSurface(jni::Environment::current(), surface),
      .width = width,
      .height = height
  };
}

void VideoPipeline::removePreviewOutputSurface() {
  if (_previewOutput.surface != nullptr) {
    ANativeWindow_release(_previewOutput.surface);
    _previewOutput = {
        .surface = nullptr,
        .width = 0,
        .height = 0
    };
    _context = nullptr;
  }
}

void VideoPipeline::setPreviewOutputSurface(jobject surface, jint width, jint height) {
  // 1. Delete existing output surface
  removeRecordingSessionOutputSurface();

  // 2. Set new output surface if it is not null
  _previewOutput = {
      .surface = ANativeWindow_fromSurface(jni::Environment::current(), surface),
      .width = width,
      .height = height
  };
  _context = OpenGLContext::CreateWithWindowSurface(_previewOutput.surface);
}

int VideoPipeline::getInputTextureId() {
  if (_context == nullptr) throw std::runtime_error("Failed to get input texture ID: The context is not yet ready.");
  _context->use();

  if (_inputTextureId != NO_TEXTURE) return static_cast<int>(_inputTextureId);

  GLuint textureId;
  glGenTextures(1, &textureId);
  glBindTexture(GL_TEXTURE_EXTERNAL_OES, textureId);
  _inputTextureId = textureId;

  return static_cast<int>(_inputTextureId);
}

void VideoPipeline::onBeforeFrame() {
  if (_context == nullptr) throw std::runtime_error("Failed to render a Frame: The context is not yet ready.");
  _context->use();

  glBindTexture(GL_TEXTURE_EXTERNAL_OES, _inputTextureId);
}

void VideoPipeline::onFrame(jni::alias_ref<jni::JArrayFloat> transformMatrixParam, jni::alias_ref<jni::JArrayFloat> rotationMatrixParam) {
  if (_context == nullptr) throw std::runtime_error("Failed to render a Frame: The context is not yet ready.");
  _context->use();

  // Shader sources
  const char* vertexShaderSource = R"(
    attribute vec2 inPosition;
    attribute vec2 inTexCoord;
    varying vec2 fragTexCoord;
    uniform float rotationAngle;
    uniform bool isMirrored;

    mat2 rotationMatrix2D(float angle) {
      float c = cos(angle);
      float s = sin(angle);
      return mat2(c, -s, s, c);
    }

    void main() {
      gl_Position = vec4(rotationMatrix2D(rotationAngle) * inPosition, 0.0, 1.0);
      if (isMirrored) {
          fragTexCoord = vec2(inTexCoord.x, 1.0 - inTexCoord.y);
      } else {
          fragTexCoord = inTexCoord;
      }
    }
  )";

  const char* fragmentShaderSource = R"(
    #extension GL_OES_EGL_image_external : require
    precision mediump float;
    varying vec2 fragTexCoord;
    uniform samplerExternalOES textureSampler;  // Use samplerExternalOES for GL_TEXTURE_EXTERNAL_OES

    void main() {
        gl_FragColor = texture2D(textureSampler, fragTexCoord);
    }
  )";

  GLuint vertexShader = glCreateShader(GL_VERTEX_SHADER);
  GLuint fragmentShader = glCreateShader(GL_FRAGMENT_SHADER);

  glShaderSource(vertexShader, 1, &vertexShaderSource, nullptr);
  glCompileShader(vertexShader);

  glShaderSource(fragmentShader, 1, &fragmentShaderSource, nullptr);
  glCompileShader(fragmentShader);

  GLuint shaderProgram = glCreateProgram();
  glAttachShader(shaderProgram, vertexShader);
  glAttachShader(shaderProgram, fragmentShader);
  glLinkProgram(shaderProgram);
  glUseProgram(shaderProgram);


  glBindTexture(GL_TEXTURE_EXTERNAL_OES, _inputTextureId);
  glTexParameteri(GL_TEXTURE_EXTERNAL_OES, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
  glTexParameteri(GL_TEXTURE_EXTERNAL_OES, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
  glTexParameteri(GL_TEXTURE_EXTERNAL_OES, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
  glTexParameteri(GL_TEXTURE_EXTERNAL_OES, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);

  // Define quad geometry and texture coordinates
  GLfloat vertices[] = {
      -1.0f, -1.0f,
      1.0f, -1.0f,
      -1.0f,  1.0f,
      1.0f,  1.0f,
  };

  GLfloat texCoords[] = {
      0.0f, 0.0f,
      1.0f, 0.0f,
      0.0f, 1.0f,
      1.0f, 1.0f,
  };

  // Set vertex attributes directly (no need for VAO)
  GLint posAttrib = glGetAttribLocation(shaderProgram, "inPosition");
  GLint texAttrib = glGetAttribLocation(shaderProgram, "inTexCoord");
  GLint textureLocation = glGetUniformLocation(shaderProgram, "textureSampler");
  GLint mirrorLocation = glGetUniformLocation(shaderProgram, "isMirrored");

  float angleDegrees = 90.0f;  // Rotate by 45 degrees
  float angleRadians = angleDegrees * 3.14159f / 180.0f;  // Convert to radians
  GLint rotationAngleLocation = glGetUniformLocation(shaderProgram, "rotationAngle");
  glUniform1f(rotationAngleLocation, angleRadians);

  glUniform1i(mirrorLocation, true);


  glVertexAttribPointer(posAttrib, 2, GL_FLOAT, GL_FALSE, 0, vertices);
  glVertexAttribPointer(texAttrib, 2, GL_FLOAT, GL_FALSE, 0, texCoords);

  glEnableVertexAttribArray(posAttrib);
  glEnableVertexAttribArray(texAttrib);

  // Use GL_TEXTURE_EXTERNAL_OES for the shader
  glActiveTexture(GL_TEXTURE0);
  glBindTexture(GL_TEXTURE_EXTERNAL_OES, _inputTextureId);
  glUniform1i(textureLocation, 0);

  glDrawArrays(GL_TRIANGLE_STRIP, 0, 4);


  eglSwapBuffers(_context->display, _context->surface);
}

void VideoPipeline::registerNatives() {
  registerHybrid({
    makeNativeMethod("initHybrid", VideoPipeline::initHybrid),
    makeNativeMethod("setFrameProcessorOutputSurface", VideoPipeline::setFrameProcessorOutputSurface),
    makeNativeMethod("removeFrameProcessorOutputSurface", VideoPipeline::removeFrameProcessorOutputSurface),
    makeNativeMethod("setRecordingSessionOutputSurface", VideoPipeline::setRecordingSessionOutputSurface),
    makeNativeMethod("removeRecordingSessionOutputSurface", VideoPipeline::removeRecordingSessionOutputSurface),
    makeNativeMethod("setPreviewOutputSurface", VideoPipeline::setPreviewOutputSurface),
    makeNativeMethod("removePreviewOutputSurface", VideoPipeline::removePreviewOutputSurface),
    makeNativeMethod("getInputTextureId", VideoPipeline::getInputTextureId),
    makeNativeMethod("onBeforeFrame", VideoPipeline::onBeforeFrame),
    makeNativeMethod("onFrame", VideoPipeline::onFrame),
  });
}



  const GLfloat* VideoPipeline::VertexData() {
    static const GLfloat vertexData[] = {
        -1.0f, -1.0f, 0.0, 1.0, 0.0f, 0.0f,
        +1.0f, -1.0f, 0.0, 1.0, 1.0f, 0.0f,
        -1.0f, +1.0f, 0.0, 1.0, 0.0f, 1.0f,
        +1.0f, +1.0f, 0.0, 1.0, 1.0f, 1.0f,
    };

    return vertexData;
  }

  const GLushort* VideoPipeline::VertexIndices() {
    static const GLushort vertexIndices[] = {
        0, 1, 2, 3
    };

    return vertexIndices;
  }

  const char* VideoPipeline::VertexShaderCode() {
    static const char vertexShader[] =
        "uniform mat4 uTransformMatrix;\n"
        "uniform mat4 uRotationMatrix;\n"
        "attribute vec4 aPosition;\n"
        "attribute vec4 aTexCoord;\n"
        "varying vec2 vTexCoord;\n"
        "void main() {\n"
        "    gl_Position = uRotationMatrix * aPosition;\n"
        "    vTexCoord = (uTransformMatrix * aTexCoord).xy;\n"
        "}\n";

    return vertexShader;
  }

  const char* VideoPipeline::FragmentShaderCode() {
    static const char fragmentShader[] =
        "#extension GL_OES_EGL_image_external:require\n"
        "precision mediump float;\n"
        "uniform samplerExternalOES uTexture;\n"
        "varying vec2 vTexCoord;\n"
        "void main() {\n"
        "    gl_FragColor = texture2D(uTexture, vTexCoord);\n"
        "}\n";

    return fragmentShader;
  }

  GLuint VideoPipeline::LoadShader(GLenum shaderType, const char* shaderCode) {
    GLuint shader = glCreateShader(shaderType);
    if (shader) {
      glShaderSource(shader, 1, &shaderCode, NULL);
      glCompileShader(shader);
      GLint compileStatus = GL_FALSE;
      glGetShaderiv(shader, GL_COMPILE_STATUS, &compileStatus);
      if (!compileStatus) {
        GLint infoLength = 0;
        glGetShaderiv(shader, GL_INFO_LOG_LENGTH, &infoLength);
        if (infoLength) {
          char* infoBuffer = (char*) malloc((size_t) infoLength);
          if (infoBuffer) {
            glGetShaderInfoLog(shader, infoLength, NULL, infoBuffer);
            // todo: output log
            free(infoBuffer);
          }
        }
        glDeleteShader(shader);
        shader = 0;
      }
    }
    return shader;
  }

  GLuint VideoPipeline::CreateProgram(const char* vertexShaderCode,
                                             const char* fragmentShaderCode) {
    GLuint vertexShader = LoadShader(GL_VERTEX_SHADER, vertexShaderCode);
    if (!vertexShader) {
      return 0;
    }

    GLuint fragmentShader = LoadShader(GL_FRAGMENT_SHADER, fragmentShaderCode);
    if (!fragmentShader) {
      return 0;
    }

    GLuint program = glCreateProgram();
    if (program) {
      glAttachShader(program, vertexShader);
      // TODO: check error and throw if needed

      glAttachShader(program, fragmentShader);
      // TODO: check error and throw if needed

      glLinkProgram(program);
      GLint linkStatus = GL_FALSE;
      glGetProgramiv(program, GL_LINK_STATUS, &linkStatus);
      if (!linkStatus) {
        GLint infoLength = 0;
        glGetProgramiv(program, GL_INFO_LOG_LENGTH, &infoLength);
        if (infoLength) {
          char* infoBuffer = (char*) malloc((size_t) infoLength);
          if (infoBuffer) {
            glGetProgramInfoLog(program, infoLength, NULL, infoBuffer);
            // todo: output log
            free(infoBuffer);
          }
        }
        glDeleteProgram(program);
        program = 0;
      }
    }
    return program;
  }

} // vision