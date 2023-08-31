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
   * Renders a Frame (`inputTextureId`) to a given output Frame Buffer (`outputFrameBufferId`) using Skia.
   * @param glContext The OpenGL context to use for rendering
   * @param inputTexture The input inputTexture (from `glGenTextures`) that holds the Camera frame.
   *
   * @returns A reference to the inputTexture that this call was rendered to.
   */
  OpenGLTexture renderFrame(OpenGLContext& glContext, OpenGLTexture& inputTexture, float* transformMatrix);

  void renderToSurface(OpenGLContext& glContext, OpenGLTexture& texture, EGLSurface glSurface);

 private:
  // Skia Context
  sk_sp<GrDirectContext> _skiaContext;

  sk_sp<SkSurface> _offscreenSurface;
  GLuint _offscreenSurfaceTextureId = NO_TEXTURE;

  static auto constexpr TAG = "SkiaRenderer";
};

} // namespace vision

#endif
