//
// Created by Marc Rousavy on 29.08.23.
//

#include "OpenGLContext.h"

#include <EGL/egl.h>
#include <GLES2/gl2.h>
#include <GLES2/gl2ext.h>

#include <android/native_window.h>
#include <android/log.h>

#include "OpenGLError.h"

namespace vision {

std::shared_ptr<OpenGLContext> OpenGLContext::CreateWithOffscreenSurface(int width, int height) {
  return std::unique_ptr<OpenGLContext>(new OpenGLContext(width, height));
}

OpenGLContext::OpenGLContext(int width, int height) {
  _width = width;
  _height = height;
}

OpenGLContext::~OpenGLContext() {
  destroy();
}

void OpenGLContext::destroy() {
  if (display != EGL_NO_DISPLAY) {
    eglMakeCurrent(display, offscreenSurface, offscreenSurface, context);
    if (offscreenSurface != EGL_NO_SURFACE) {
      __android_log_print(ANDROID_LOG_INFO, TAG, "Destroying OpenGL Surface...");
      eglDestroySurface(display, offscreenSurface);
      offscreenSurface = EGL_NO_SURFACE;
    }
    if (context != EGL_NO_CONTEXT) {
      __android_log_print(ANDROID_LOG_INFO, TAG, "Destroying OpenGL Context...");
      eglDestroyContext(display, context);
      context = EGL_NO_CONTEXT;
    }
    __android_log_print(ANDROID_LOG_INFO, TAG, "Destroying OpenGL Display...");
    eglTerminate(display);
    display = EGL_NO_DISPLAY;
    config = nullptr;
  }
}

void OpenGLContext::ensureOpenGL() {
  bool successful;
  // EGLDisplay
  if (display == EGL_NO_DISPLAY) {
    __android_log_print(ANDROID_LOG_INFO, TAG, "Initializing EGLDisplay..");
    display = eglGetDisplay(EGL_DEFAULT_DISPLAY);
    if (display == EGL_NO_DISPLAY) throw OpenGLError("Failed to get default OpenGL Display!");

    EGLint major;
    EGLint minor;
    successful = eglInitialize(display, &major, &minor);
    if (!successful) throw OpenGLError("Failed to initialize OpenGL!");
  }

  // EGLConfig
  if (config == nullptr) {
    __android_log_print(ANDROID_LOG_INFO, TAG, "Initializing EGLConfig..");
    EGLint attributes[] = {EGL_RENDERABLE_TYPE, EGL_OPENGL_ES2_BIT,
                           EGL_SURFACE_TYPE, EGL_WINDOW_BIT,
                           EGL_ALPHA_SIZE, 8,
                           EGL_BLUE_SIZE, 8,
                           EGL_GREEN_SIZE, 8,
                           EGL_RED_SIZE, 8,
                           EGL_DEPTH_SIZE, 0,
                           EGL_STENCIL_SIZE, 0,
                           EGL_NONE};
    EGLint numConfigs;
    successful = eglChooseConfig(display, attributes, &config, 1, &numConfigs);
    if (!successful || numConfigs == 0) throw OpenGLError("Failed to choose OpenGL config!");
  }

  // EGLContext
  if (context == EGL_NO_CONTEXT) {
    __android_log_print(ANDROID_LOG_INFO, TAG, "Initializing EGLContext..");
    EGLint contextAttributes[] = {EGL_CONTEXT_CLIENT_VERSION, 2, EGL_NONE};
    context = eglCreateContext(display, config, nullptr, contextAttributes);
    if (context == EGL_NO_CONTEXT) throw OpenGLError("Failed to create OpenGL context!");
  }

  // EGLSurface
  if (offscreenSurface == EGL_NO_SURFACE) {
    // If we don't have a surface at all
    __android_log_print(ANDROID_LOG_INFO, TAG, "Initializing %i x %i offscreen pbuffer EGLSurface..", _width, _height);
    EGLint attributes[] = {EGL_WIDTH, _width,
                           EGL_HEIGHT, _height,
                           EGL_NONE};
    offscreenSurface = eglCreatePbufferSurface(display, config, attributes);
    if (offscreenSurface == EGL_NO_SURFACE) throw OpenGLError("Failed to create OpenGL Surface!");
  }
}

void OpenGLContext::use() {
  this->use(offscreenSurface);
}

void OpenGLContext::use(EGLSurface surface) {
  if (surface == EGL_NO_SURFACE) throw OpenGLError("Cannot render to a null Surface!");

  // 1. Make sure the OpenGL context is initialized
  this->ensureOpenGL();

  // 2. Make the OpenGL context current
  bool successful = eglMakeCurrent(display, surface, surface, context);
  if (!successful || eglGetError() != EGL_SUCCESS) throw OpenGLError("Failed to use current OpenGL context!");

  // 3. Caller can now render to this surface
}

GLuint OpenGLContext::createTexture() {
  // 1. Make sure the OpenGL context is initialized
  this->ensureOpenGL();

  // 2. Make the OpenGL context current
  bool successful = eglMakeCurrent(display, offscreenSurface, offscreenSurface, context);
  if (!successful || eglGetError() != EGL_SUCCESS) throw OpenGLError("Failed to use current OpenGL context!");

  GLuint textureId;
  glGenTextures(1, &textureId);

  return textureId;
}

} // namespace vision
