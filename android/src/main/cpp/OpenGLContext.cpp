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

std::unique_ptr<OpenGLContext> OpenGLContext::CreateWithWindowSurface(ANativeWindow* surface) {
  return std::unique_ptr<OpenGLContext>(new OpenGLContext(surface));
}

std::unique_ptr<OpenGLContext> OpenGLContext::CreateWithOffscreenSurface(int width, int height) {
  return std::unique_ptr<OpenGLContext>(new OpenGLContext(width, height));
}

OpenGLContext::OpenGLContext(ANativeWindow *surface) {
  contextType = GLContextType::Window;
  // TODO: Do I need to acquire that ref? ANativeWindow_acquire(surface);
  _outputSurface = surface;
  _width = ANativeWindow_getWidth(surface);
  _height = ANativeWindow_getHeight(surface);
}

OpenGLContext::OpenGLContext(int width, int height) {
  contextType = GLContextType::Offscreen;
  _outputSurface = nullptr;
  _width = width;
  _height = height;
}

OpenGLContext::~OpenGLContext() {
  if (_outputSurface != nullptr) {
    ANativeWindow_release(_outputSurface);
  }
  destroy();
}

int OpenGLContext::getWidth() const {
  return _width;
}

int OpenGLContext::getHeight() const {
  return _height;
}

void OpenGLContext::destroy() {
  if (display != EGL_NO_DISPLAY) {
    eglMakeCurrent(display, surface, surface, context);
    if (surface != EGL_NO_SURFACE) {
      __android_log_print(ANDROID_LOG_INFO, TAG, "Destroying OpenGL Surface...");
      eglDestroySurface(display, surface);
      surface = EGL_NO_SURFACE;
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

void OpenGLContext::use() {
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
    auto surfaceType = contextType == GLContextType::Window ? EGL_WINDOW_BIT : EGL_PBUFFER_BIT;
    EGLint attributes[] = {EGL_RENDERABLE_TYPE, EGL_OPENGL_ES2_BIT,
                           EGL_SURFACE_TYPE, surfaceType,
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
  if (surface == EGL_NO_SURFACE) {
    // If we don't have a surface at all
    switch (contextType) {
      case GLContextType::Window: {
        __android_log_print(ANDROID_LOG_INFO, TAG, "Initializing %i x %i window EGLSurface..", _width, _height);
        surface = eglCreateWindowSurface(display, config, _outputSurface, nullptr);
        break;
      }
      case GLContextType::Offscreen: {
        __android_log_print(ANDROID_LOG_INFO, TAG, "Initializing %i x %i offscreen pbuffer EGLSurface..", _width, _height);
        EGLint attributes[] = {EGL_WIDTH, _width,
                               EGL_HEIGHT, _height,
                               EGL_NONE};
        surface = eglCreatePbufferSurface(display, config, attributes);
        break;
      }
      default: {
        throw std::runtime_error("Invalid contextType!");
      }
    }
    if (surface == EGL_NO_SURFACE) throw OpenGLError("Failed to create OpenGL Surface!");
  }

  successful = eglMakeCurrent(display, surface, surface, context);
  if (!successful || eglGetError() != EGL_SUCCESS) throw OpenGLError("Failed to use current OpenGL context!");
}

void OpenGLContext::renderTextureToSurface(GLuint textureId, float* transformMatrix) {
  // 1. Activate current OpenGL context (eglMakeCurrent)
  this->use();

  // 2. Set the viewport for rendering
  glViewport(0, 0, _width, _height);
  glDisable(GL_BLEND);

  // 3. Bind the input texture
  glBindTexture(GL_TEXTURE_EXTERNAL_OES, textureId);
  glTexParameteri(GL_TEXTURE_EXTERNAL_OES, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
  glTexParameteri(GL_TEXTURE_EXTERNAL_OES, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
  glTexParameteri(GL_TEXTURE_EXTERNAL_OES, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
  glTexParameteri(GL_TEXTURE_EXTERNAL_OES, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);

  // 4. Draw it using the pass-through shader which also applies transforms
  _passThroughShader.draw(textureId, transformMatrix);

  // 5. Swap buffers to pass it to the window surface
  eglSwapBuffers(display, surface);
}

} // vision