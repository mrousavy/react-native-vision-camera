//
// Created by Marc Rousavy on 10.08.23.
//

#pragma once

#if VISION_CAMERA_ENABLE_SKIA

#include <GLES2/gl2.h>
#include <EGL/egl.h>
#include <android/native_window.h>

#include <include/core/SkSurface.h>
#include <include/gpu/GrDirectContext.h>

#include "OpenGLContext.h"
#include "OpenGLTexture.h"

namespace vision {

#define NO_TEXTURE 0

using DrawCallback = std::function<void(SkCanvas*)>;

class SkiaRenderer {
 public:
  /**
   * Create a new Skia renderer. You need to use OpenGL outside of this context to make sure the
   * Skia renderer can use the global OpenGL context.
   */
  explicit SkiaRenderer() {};
  ~SkiaRenderer();

  /**
   * Renders the given Texture (might be a Camera Frame) to a cached offscreen Texture using Skia.
   *
   * @returns The texture that was rendered to.
   */
  OpenGLTexture renderTextureToOffscreenSurface(OpenGLContext& glContext,
                                                OpenGLTexture& texture,
                                                float* transformMatrix,
                                                const DrawCallback& drawCallback);

  /**
   * Renders the given texture to the target output surface using Skia.
   */
  void renderTextureToSurface(OpenGLContext& glContext,
                              OpenGLTexture& texture,
                              EGLSurface surface);

 private:
  // Gets or creates the Skia context.
  sk_sp<GrDirectContext> getSkiaContext();
  // Wraps a Texture as an SkImage allowing you to draw it
  sk_sp<SkImage> wrapTextureAsImage(OpenGLTexture& texture);
  // Wraps an EGLSurface as an SkSurface allowing you to draw into it
  sk_sp<SkSurface> wrapEglSurfaceAsSurface(EGLSurface eglSurface);
  // Gets or creates an off-screen surface that you can draw into
  sk_sp<SkSurface> getOffscreenSurface(int width, int height);

 private:
  // Skia Context
  sk_sp<GrDirectContext> _skiaContext = nullptr;
  sk_sp<SkSurface> _offscreenSurface = nullptr;
  GLuint _offscreenSurfaceTextureId = NO_TEXTURE;

  static auto constexpr TAG = "SkiaRenderer";
};

} // namespace vision

#endif
