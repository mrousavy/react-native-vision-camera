//
// Created by Marc Rousavy on 25.08.23.
//

#include "VideoPipeline.h"
#include "OpenGLError.h"

namespace vision {

jni::local_ref<VideoPipeline::jhybriddata> VideoPipeline::initHybrid(jni::alias_ref<jhybridobject> jThis) {
  return makeCxxInstance(jThis);
}

VideoPipeline::VideoPipeline(jni::alias_ref<jhybridobject> jThis): _javaPart(jni::make_global(jThis)) { }

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

void VideoPipeline::registerNatives() {
  registerHybrid({
     makeNativeMethod("initHybrid", VideoPipeline::initHybrid),
  });
}

} // vision