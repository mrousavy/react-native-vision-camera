//
// Created by Marc Rousavy on 29.08.23.
//

#pragma once

#include <EGL/egl.h>
#include <android/native_window.h>
#include <memory>

namespace vision {

enum GLContextType {
  Window, Offscreen
};

class OpenGLContext {

 public:
  /**
   * Create a new instance of the OpenGLContext that draws to an on-screen window surface.
   * This will not perform any OpenGL operations yet, and is therefore safe to call from any Thread.
   */
  static std::unique_ptr<OpenGLContext> CreateWithWindowSurface(ANativeWindow* surface);
  /**
   * Create a new instance of the OpenGLContext that draws to an off-screen pixelbuffer surface.
   * This will not perform any OpenGL operations yet, and is therefore safe to call from any Thread.
   */
  static std::unique_ptr<OpenGLContext> CreateWithOffscreenSurface(int width, int height);
  /**
   * Destroy the OpenGL Context. This needs to be called on the same thread that `use()` was called.
   */
  ~OpenGLContext();

  /**
   * Activate the OpenGL context and make it "current". This will lazily create the context, surface and display.
   */
  void use();

  /**
   * Destroys the OpenGL context. This needs to be called on the same thread that `use()` was called.
   * After calling `destroy()`, it is legal to call `use()` again, which will re-construct everything.
   */
  void destroy();

  int getWidth();
  int getHeight();

 public:
  EGLDisplay display = EGL_NO_DISPLAY;
  EGLSurface surface = EGL_NO_SURFACE;
  EGLContext context = EGL_NO_CONTEXT;
  EGLConfig config = nullptr;

  GLContextType contextType;

 private:
  ANativeWindow* _outputSurface;
  int _width = 0, _height = 0;
  explicit OpenGLContext(ANativeWindow* surface);
  explicit OpenGLContext(int width, int height);

 private:
  static constexpr auto TAG = "OpenGLContext";
};

} // vision

