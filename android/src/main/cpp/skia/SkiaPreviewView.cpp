//
// Created by Marc Rousavy on 09.08.23.
//

#include "SkiaPreviewView.h"
#include <GLES2/gl2.h>
#include <EGL/egl.h>

#include <include/gpu/GrBackendSurface.h>
#include <include/gpu/ganesh/SkSurfaceGanesh.h>
#include <include/core/SkColorSpace.h>
#include <include/core/SkCanvas.h>
#include <gpu/gl/GrGLTypes.h>
#include <gpu/gl/GrGLInterface.h>
#include <gpu/GrDirectContext.h>
#include <core/SkSurface.h>

// Defined in <gpu/ganesh/gl/GrGLDefines.h>
#define GR_GL_RGBA8 0x8058

namespace vision {

jni::local_ref<SkiaPreviewView::jhybriddata> SkiaPreviewView::initHybrid(jni::alias_ref<jhybridobject> jThis) {
  return makeCxxInstance(jThis);
}

void SkiaPreviewView::destroy() {
  return;

  if (_display != nullptr || _context != nullptr) {
    eglMakeCurrent(_display, EGL_NO_SURFACE, EGL_NO_DISPLAY, EGL_NO_CONTEXT);
    eglDestroyContext(_display, _context);
    _context = nullptr;
    eglReleaseThread();
    eglTerminate(_display);
    _display = nullptr;
  }
}

void SkiaPreviewView::onSurfaceCreated() {
  return;

  glGenBuffers(1, &_vertexBuffer);
  glBindBuffer(GL_ARRAY_BUFFER, _vertexBuffer);
  glBufferData(GL_ARRAY_BUFFER, 24 * sizeof(GLfloat), VertexData(), GL_STATIC_DRAW);

  GLuint program = CreateProgram(VertexShaderCode(), FragmentShaderCode());
  if (!program) {
    // TODO: throw here
    return;
  }

  glUseProgram(program);

  GLint aPosition = glGetAttribLocation(program, "aPosition");
  GLint aTexCoord = glGetAttribLocation(program, "aTexCoord");

  glPixelStorei(GL_UNPACK_ALIGNMENT, 1);

  if (glGetError() != GL_NO_ERROR) {
    glDeleteProgram(program);

    // TODO: throw here
    return;
  }

  this->_program = program;
  this->_aPosition = aPosition;
  this->_aTexCoord = aTexCoord;
}

void SkiaPreviewView::onSurfaceDestroyed() {

}

sk_sp<SkSurface> createSkiaSurface(int textureId, int width, int height) {
  return nullptr;

  // Create the Skia backend context
  auto backendInterface = GrGLMakeNativeInterface();
  auto grContext = GrDirectContext::MakeGL(backendInterface);
  if (grContext == nullptr) throw OpenGLError("Failed to create Skia Context!");

  GrGLFramebufferInfo fbInfo;
  fbInfo.fFBOID = 0;
  fbInfo.fFormat = GR_GL_RGBA8;

  auto renderTarget = GrBackendRenderTarget(width, height, 0, 8, fbInfo);

  auto surface = SkSurfaces::WrapBackendRenderTarget(
      grContext.get(), renderTarget, kBottomLeft_GrSurfaceOrigin,
      kRGBA_8888_SkColorType, nullptr, nullptr,
      nullptr,
      nullptr);

  return surface;
}

void SkiaPreviewView::onDrawFrame(int texture, int textureWidth, int textureHeight) {
  return;

  glBindTexture(GL_TEXTURE_2D, texture);

  int viewportX = 0;
  int viewportY = 0;
  int viewportWidth = _surfaceWidth;
  int viewportHeight = _surfaceHeight;

  int candidateWidth = (int) (((float) textureWidth / (float) textureHeight) * (float)_surfaceHeight);
  int candidateHeight = (int) (((float) textureHeight / (float) textureWidth) * (float)_surfaceWidth);

  if (candidateWidth > _surfaceWidth) {
    viewportX = -1 * (candidateWidth - _surfaceWidth) / 2;
    viewportWidth = candidateWidth;
  } else if (candidateHeight > _surfaceHeight) {
    viewportY = -1 * (candidateHeight - _surfaceHeight) / 2;
    viewportHeight = candidateHeight;
  }

  glViewport(viewportX, viewportY, viewportWidth, viewportHeight);

  glUseProgram(_program);
  glVertexAttribPointer(_aPosition, 4, GL_FLOAT, GL_FALSE, 6 * sizeof(GLfloat), (const GLvoid*) (0 * sizeof(GLfloat)));
  glEnableVertexAttribArray(_aPosition);
  glVertexAttribPointer(_aTexCoord, 2, GL_FLOAT, GL_FALSE, 6 * sizeof(GLfloat), (const GLvoid*) (4 * sizeof(GLfloat)));
  glEnableVertexAttribArray(_aTexCoord);
  glBindBuffer(GL_ARRAY_BUFFER, _vertexBuffer);
  glDrawElements(GL_TRIANGLE_STRIP, 4, GL_UNSIGNED_SHORT, VertexIndices());

  auto surface = createSkiaSurface(0, 1280, 720);
  auto canvas = surface->getCanvas();
  auto rect = SkRect::MakeXYWH(50, 150, 30, 50);
  auto paint = SkPaint();
  paint.setColor(SkColors::kRed);
  canvas->drawRect(rect, paint);
  canvas->flush();
  surface->flushAndSubmit();

  glFlush();
}

void SkiaPreviewView::onSurfaceResized(int width, int height) {
  this->_surfaceWidth = width;
  this->_surfaceHeight = height;
}

void SkiaPreviewView::registerNatives() {
  registerHybrid({
    makeNativeMethod("initHybrid", SkiaPreviewView::initHybrid),
    makeNativeMethod("destroy", SkiaPreviewView::destroy),
    makeNativeMethod("onDrawFrame", SkiaPreviewView::onDrawFrame),
    makeNativeMethod("onSurfaceResized", SkiaPreviewView::onSurfaceResized),
    makeNativeMethod("onSurfaceCreated", SkiaPreviewView::onSurfaceCreated),
    makeNativeMethod("onSurfaceDestroyed", SkiaPreviewView::onSurfaceDestroyed),
  });
}


const GLfloat* SkiaPreviewView::VertexData() {
  static const GLfloat vertexData[] = {
      -1.0f, -1.0f, 0.0, 1.0, 0.0f, 0.0f,
      +1.0f, -1.0f, 0.0, 1.0, 1.0f, 0.0f,
      -1.0f, +1.0f, 0.0, 1.0, 0.0f, 1.0f,
      +1.0f, +1.0f, 0.0, 1.0, 1.0f, 1.0f,
  };

  return vertexData;
}

const GLushort* SkiaPreviewView::VertexIndices() {
  static const GLushort vertexIndices[] = {
      0, 1, 2, 3
  };

  return vertexIndices;
}

const char* SkiaPreviewView::VertexShaderCode() {
  static const char vertexShader[] =
      "attribute vec4 aPosition;\n"
      "attribute vec4 aTexCoord;\n"
      "varying vec2 vTexCoord;\n"
      "void main() {\n"
      "    gl_Position = aPosition;\n"
      "    vTexCoord = aTexCoord.xy;\n"
      "}\n";

  return vertexShader;
}

const char* SkiaPreviewView::FragmentShaderCode() {
  static const char fragmentShader[] =
      "precision mediump float;\n"
      "uniform sampler2D uTexture;\n"
      "varying vec2 vTexCoord;\n"
      "void main() {\n"
      "    vec4 color = texture2D(uTexture, vTexCoord);\n"
      "    gl_FragColor = color;\n"
      "}\n";

  return fragmentShader;
}

GLuint SkiaPreviewView::LoadShader(GLenum shaderType, const char* shaderCode) {
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

GLuint SkiaPreviewView::CreateProgram(const char* vertexShaderCode, const char* fragmentShaderCode) {
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

} // namespace vision
