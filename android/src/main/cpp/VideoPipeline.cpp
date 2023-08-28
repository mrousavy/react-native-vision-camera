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
  // 2. Delete the pass-through shader
  delete _passThroughShader;
  if (_vertexBuffer != 0) {
    glDeleteBuffers(1, &_vertexBuffer);
    _vertexBuffer = 0;
  }
  // 3. Delete the input textures
  if (_inputTextureId != 0) {
    glDeleteTextures(1, &_inputTextureId);
  }
  // 4. Delete the OpenGL context
  if (_context.display != EGL_NO_DISPLAY) {
    eglMakeCurrent(_context.display, EGL_NO_SURFACE, EGL_NO_SURFACE, EGL_NO_CONTEXT);
    if (_context.surface != EGL_NO_SURFACE) {
      __android_log_print(ANDROID_LOG_INFO, TAG, "Destroying OpenGL Surface...");
      eglDestroySurface(_context.display, _context.surface);
      _context.surface = EGL_NO_SURFACE;
    }
    if (_context.context != EGL_NO_CONTEXT) {
      __android_log_print(ANDROID_LOG_INFO, TAG, "Destroying OpenGL Context...");
      eglDestroyContext(_context.display, _context.context);
      _context.context = EGL_NO_CONTEXT;
    }
    __android_log_print(ANDROID_LOG_INFO, TAG, "Destroying OpenGL Display...");
    eglTerminate(_context.display);
    _context.display = EGL_NO_DISPLAY;
  }
}

void VideoPipeline::setSize(int width, int height) {
  _width = width;
  _height = height;
}

GLContext& VideoPipeline::getGLContext() {
  bool successful;
  // EGLDisplay
  if (_context.display == EGL_NO_DISPLAY) {
    __android_log_print(ANDROID_LOG_INFO, TAG, "Initializing EGLDisplay..");
    _context.display = eglGetDisplay(EGL_DEFAULT_DISPLAY);
    if (_context.display == EGL_NO_DISPLAY) throw OpenGLError("Failed to get default OpenGL Display!");

    EGLint major;
    EGLint minor;
    successful = eglInitialize(_context.display, &major, &minor);
    if (!successful) throw OpenGLError("Failed to initialize OpenGL!");
  }

  // EGLConfig
  if (_context.config == nullptr) {
    __android_log_print(ANDROID_LOG_INFO, TAG, "Initializing EGLConfig..");
    EGLint attributes[] = {EGL_RENDERABLE_TYPE, EGL_OPENGL_ES2_BIT,
                           EGL_SURFACE_TYPE, EGL_PBUFFER_BIT,
                           EGL_ALPHA_SIZE, 8,
                           EGL_BLUE_SIZE, 8,
                           EGL_GREEN_SIZE, 8,
                           EGL_RED_SIZE, 8,
                           EGL_DEPTH_SIZE, 0,
                           EGL_STENCIL_SIZE, 0,
                           EGL_NONE};
    EGLint numConfigs;
    successful = eglChooseConfig(_context.display, attributes, &_context.config, 1, &numConfigs);
    if (!successful || numConfigs == 0) throw OpenGLError("Failed to choose OpenGL config!");
  }

  // EGLContext
  if (_context.context == EGL_NO_CONTEXT) {
    __android_log_print(ANDROID_LOG_INFO, TAG, "Initializing EGLContext..");
    EGLint contextAttributes[] = {EGL_CONTEXT_CLIENT_VERSION, 2, EGL_NONE};
    _context.context = eglCreateContext(_context.display, _context.config, nullptr, contextAttributes);
    if (_context.context == EGL_NO_CONTEXT) throw OpenGLError("Failed to create OpenGL context!");
  }

  // EGLSurface
  if (_context.surface == EGL_NO_SURFACE) {
    // If we don't have a surface at all
    __android_log_print(ANDROID_LOG_INFO, TAG, "Initializing EGLSurface..");
    EGLint attributes[] = {EGL_WIDTH, _width,
                           EGL_HEIGHT, _height,
                           EGL_NONE};
    _context.surface = eglCreatePbufferSurface(_context.display, _context.config, attributes);
  } else {
    // If the surface size has changed we need to resize the surface
    int currentWidth = 0, currentHeight = 0;
    eglQuerySurface(_context.display, _context.surface, EGL_WIDTH, &currentWidth);
    eglQuerySurface(_context.display, _context.surface, EGL_HEIGHT, &currentHeight);
    if (currentWidth != _width || currentHeight != _height) {
      __android_log_print(ANDROID_LOG_INFO, TAG, "Resizing EGLSurface from (%i x %i) to (%i x %i)..",
                          currentWidth, currentHeight, _width, _height);
      // Destroy current surface
      eglDestroySurface(_context.display, _context.surface);
      _context.surface = EGL_NO_SURFACE;
      // Create new one with new dimensions
      EGLint attributes[] = {EGL_WIDTH, _width,
                             EGL_HEIGHT, _height,
                             EGL_NONE};
      _context.surface = eglCreatePbufferSurface(_context.display, _context.config, attributes);
    }
  }
  if (_context.surface == EGL_NO_SURFACE) {
    throw OpenGLError("Failed to create OpenGL Surface!");
  }

  successful = eglMakeCurrent(_context.display, _context.surface, _context.surface, _context.context);
  if (!successful || eglGetError() != EGL_SUCCESS) throw OpenGLError("Failed to use current OpenGL context!");

  return _context;
}

void VideoPipeline::removeFrameProcessorOutputSurface() {
  if (_frameProcessorOutput.surface != nullptr) {
    ANativeWindow_release(_frameProcessorOutput.surface);
    _frameProcessorOutput = {
        .surface = nullptr
    };
  }
}

void VideoPipeline::setFrameProcessorOutputSurface(jobject surface) {
  // 1. Delete existing output surface
  removeFrameProcessorOutputSurface();

  // 2. Set new output surface if it is not null
  _frameProcessorOutput = {
      .surface = ANativeWindow_fromSurface(jni::Environment::current(), surface)
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
  removeRecordingSessionOutputSurface();

  // 2. Set new output surface if it is not null
  _recordingSessionOutput = {
      .surface = ANativeWindow_fromSurface(jni::Environment::current(), surface),
      .width = width,
      .height = height
  };
}

int VideoPipeline::getInputTextureId() {
  GLContext& context = getGLContext();

  if (_inputTextureId != 0) return static_cast<int>(_inputTextureId);

  GLuint textureId;
  glGenTextures(1, &textureId);
  _inputTextureId = textureId;

  return static_cast<int>(_inputTextureId);
}

void VideoPipeline::onBeforeFrame() {
  // TODO: Prepare for updateTexImage() call
}

void VideoPipeline::onFrame(jni::alias_ref<jni::JArrayFloat> transformMatrixParam, jni::alias_ref<jni::JArrayFloat> rotationMatrixParam) {
  GLContext& context = getGLContext();

  if (_passThroughShader == nullptr) {
    _passThroughShader = new PassThroughShader();

    glGenBuffers(1, &_vertexBuffer);
    glBindBuffer(GL_ARRAY_BUFFER, _vertexBuffer);
    glBufferData(GL_ARRAY_BUFFER, 24 * sizeof(GLfloat), _passThroughShader->getVertexData(), GL_STATIC_DRAW);
  }

  glViewport(0, 0, _width, _height);

  glDisable(GL_BLEND);
  glBindTexture(GL_TEXTURE_EXTERNAL_OES, _inputTextureId);


  glUseProgram(_passThroughShader->getProgramId());

  float transformMatrix[MATRIX_SIZE];
  transformMatrixParam->getRegion(0, MATRIX_SIZE - 1, transformMatrix);
  glUniformMatrix4fv(_passThroughShader->uTransformMatrix(), 1, GL_FALSE, transformMatrix);
  float rotationMatrix[MATRIX_SIZE];
  rotationMatrixParam->getRegion(0, MATRIX_SIZE - 1, rotationMatrix);
  glUniformMatrix4fv(_passThroughShader->uRotationMatrix(), 1, GL_FALSE, rotationMatrix);

  glVertexAttribPointer(_passThroughShader->aPosition(), 4, GL_FLOAT, GL_FALSE, 6 * sizeof(GLfloat), (const GLvoid*) (0 * sizeof(GLfloat)));
  glEnableVertexAttribArray(_passThroughShader->aPosition());
  glVertexAttribPointer(_passThroughShader->aTexCoord(), 2, GL_FLOAT, GL_FALSE, 6 * sizeof(GLfloat), (const GLvoid*) (4 * sizeof(GLfloat)));
  glEnableVertexAttribArray(_passThroughShader->aTexCoord());
  glBindBuffer(GL_ARRAY_BUFFER, _vertexBuffer);
  glDrawElements(GL_TRIANGLE_STRIP, 4, GL_UNSIGNED_SHORT, _passThroughShader->getVertexIndices());
}

void VideoPipeline::registerNatives() {
  registerHybrid({
    makeNativeMethod("initHybrid", VideoPipeline::initHybrid),
    makeNativeMethod("setFrameProcessorOutputSurface", VideoPipeline::setFrameProcessorOutputSurface),
    makeNativeMethod("removeFrameProcessorOutputSurface", VideoPipeline::removeFrameProcessorOutputSurface),
    makeNativeMethod("setRecordingSessionOutputSurface", VideoPipeline::setRecordingSessionOutputSurface),
    makeNativeMethod("removeRecordingSessionOutputSurface", VideoPipeline::removeRecordingSessionOutputSurface),
    makeNativeMethod("getInputTextureId", VideoPipeline::getInputTextureId),
    makeNativeMethod("onBeforeFrame", VideoPipeline::onBeforeFrame),
    makeNativeMethod("onFrame", VideoPipeline::onFrame),
  });
}

} // vision