//
// Created by Marc Rousavy on 29.08.23.
//

#pragma once

#include "PassThroughShader.h"
#include <EGL/egl.h>
#include <GLES2/gl2.h>
#include <android/native_window.h>
#include <memory>

#include "OpenGLContext.h"
#include "OpenGLTexture.h"

namespace vision {

class OpenGLRenderer {
public:
  /**
   * Create a new instance of the OpenGLRenderer that draws to an on-screen window surface.
   * This will not perform any OpenGL operations yet, and is therefore safe to call from any Thread.
   *
   * Note: The `surface` is considered moved, and the OpenGL context will release it when it is
   * being deleted.
   */
  static std::unique_ptr<OpenGLRenderer> CreateWithWindowSurface(std::shared_ptr<OpenGLContext> context, ANativeWindow* surface);
  /**
   * Destroy the OpenGL Context. This needs to be called on the same thread that `use()` was called.
   */
  ~OpenGLRenderer();

  /**
   * Renders the given Texture to the Surface
   */
  void renderTextureToSurface(const OpenGLTexture& texture, float* transformMatrix);

  /**
   * Destroys the OpenGL context. This needs to be called on the same thread that `use()` was
   * called. After calling `destroy()`, it is legal to call `use()` again, which will re-construct
   * everything.
   */
  void destroy();

private:
  explicit OpenGLRenderer(std::shared_ptr<OpenGLContext> context, ANativeWindow* surface);

private:
  int _width = 0, _height = 0;
  std::shared_ptr<OpenGLContext> _context;
  ANativeWindow* _outputSurface;
  EGLSurface _surface = EGL_NO_SURFACE;

private:
  PassThroughShader _passThroughShader;

private:
  static constexpr auto TAG = "OpenGLRenderer";
};

} // namespace vision
