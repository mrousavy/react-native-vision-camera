//
// Created by Marc Rousavy on 10.08.23.
//

#pragma once

#if VISION_CAMERA_ENABLE_SKIA

#include <jni.h>
#include <fbjni/fbjni.h>
#include <fbjni/ByteBuffer.h>

#include <GLES2/gl2.h>
#include <EGL/egl.h>
#include <include/core/SkSurface.h>
#include <android/native_window.h>

#include "OpenGLContext.h"
#include "OpenGLTexture.h"

namespace vision {

#define NO_TEXTURE 0

using namespace facebook;

class SkiaRenderer: public jni::HybridClass<SkiaRenderer> {
 public:
  static auto constexpr kJavaDescriptor = "Lcom/mrousavy/camera/skia/SkiaRenderer;";
  static void registerNatives();

 private:
  friend HybridBase;
  jni::global_ref<SkiaRenderer::javaobject> _javaPart;
  explicit SkiaRenderer(const jni::alias_ref<jhybridobject>& javaPart);

 public:
  static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jhybridobject> javaPart);
  ~SkiaRenderer();

 public:
  /**
   * Renders the given Texture (might be a Camera Frame) to a cached offscreen Texture using Skia.
   *
   * @returns The texture that was rendered to.
   */
  OpenGLTexture renderTextureToOffscreenSurface(OpenGLContext& glContext, OpenGLTexture& texture, float* transformMatrix);

  /**
   * Renders the given texture to the target output surface using Skia.
   */
  void renderTextureToSurface(OpenGLContext& glContext, OpenGLTexture& texture, EGLSurface surface);

 private:
  // Gets or creates the Skia context.
  sk_sp<GrDirectContext> getSkiaContext();
  // Wraps a Texture as an SkImage allowing you to draw it
  sk_sp<SkImage> wrapTextureAsImage(OpenGLTexture& texture);
  // Wraps a Frame Buffer as an SkSurface allowing you to draw into it
  sk_sp<SkSurface> wrapFrameBufferAsSurface(GLuint frameBufferId, int width, int height);
  // Gets or creates an off-screen surface that you can draw into
  sk_sp<SkSurface> getOffscreenSurface(int width, int height);

 private:
  // Skia Context
  sk_sp<GrDirectContext> _skiaContext;

  sk_sp<SkSurface> _offscreenSurface;
  GLuint _offscreenSurfaceTextureId = NO_TEXTURE;

  static auto constexpr TAG = "SkiaRenderer";
};

} // namespace vision

#endif
