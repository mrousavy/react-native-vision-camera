//
// Created by Marc Rousavy on 29.08.23.
//

#pragma once

#include <EGL/egl.h>
#include <android/native_window.h>

namespace vision {

class OpenGLContext {

 public:
  /**
   * Create a new instance of the OpenGLContext.
   * This constructor will not perform any OpenGL operations and is safe to call from any Thread.
   */
  explicit OpenGLContext(ANativeWindow* surface);
  /**
   * Destroy the OpenGL Context. This needs to be called on the same thread that `use()` was called.
   */
  ~OpenGLContext();

  /**
   * Activate the current OpenGL context. This will lazily create the context, surface and display.
   */
  void use();

 public:
  EGLDisplay display = EGL_NO_DISPLAY;
  EGLSurface surface = EGL_NO_SURFACE;
  EGLContext context = EGL_NO_CONTEXT;
  EGLConfig config = nullptr;

 private:
  ANativeWindow* _outputSurface;

 private:
  static constexpr auto TAG = "OpenGLContext";
};

} // vision

