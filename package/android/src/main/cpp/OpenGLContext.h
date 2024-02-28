//
// Created by Marc Rousavy on 29.08.23.
//

#pragma once

#include <EGL/egl.h>
#include <GLES2/gl2.h>

#include <functional>
#include <memory>

#include "OpenGLTexture.h"
#include "PassThroughShader.h"

namespace vision {

/**
 * An OpenGL Context that can be used to render to different surfaces.
 * By default, it creates an off-screen PixelBuffer surface.
 */
class OpenGLContext {
public:
  /**
   * Create a new instance of the OpenGLContext that draws to an off-screen PixelBuffer surface.
   * This will not perform any OpenGL operations yet, and is therefore safe to call from any Thread.
   */
  static std::shared_ptr<OpenGLContext> CreateWithOffscreenSurface();
  /**
   * Destroy the OpenGL Context. This needs to be called on the same thread that `use()` was called.
   */
  ~OpenGLContext();

  /**
   * Use this OpenGL Context to render to the given EGLSurface.
   * After the `renderFunc` returns, the default offscreen PixelBuffer surface becomes active again.
   */
  void use(EGLSurface surface);

  /**
   * Use this OpenGL Context to render to the offscreen PixelBuffer surface.
   */
  void use();

  /**
   * Flushes all drawing operations by swapping the buffers and submitting the Frame to the GPU
   */
  void flush() const;

  /**
   * Create a new texture on this context
   */
  OpenGLTexture createTexture(OpenGLTexture::Type type, int width, int height);

public:
  EGLDisplay display = EGL_NO_DISPLAY;
  EGLContext context = EGL_NO_CONTEXT;
  EGLSurface offscreenSurface = EGL_NO_SURFACE;
  EGLConfig config = nullptr;

private:
  OpenGLContext() = default;
  void destroy();
  void ensureOpenGL();

private:
  PassThroughShader _passThroughShader;

private:
  static constexpr auto TAG = "OpenGLContext";
};

} // namespace vision
