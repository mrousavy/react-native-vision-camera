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

#define NO_FRAMEBUFFER 0

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
   * @param texture The input texture (from `glGenTextures`) that holds the Camera frame.
   *
   * @returns A reference to the texture that this call was rendered to.
   */
  OpenGLTexture& renderFrame(OpenGLContext& glContext, OpenGLTexture& texture);

 private:
  // Skia Context
  sk_sp<GrDirectContext> _skiaContext;
  // An OpenGL 2D Texture, used as a render-target
  std::optional<OpenGLTexture> _offscreenTexture = std::nullopt;
  // The OpenGL Frame Buffer used as a render-target
  GLuint _framebuffer = NO_FRAMEBUFFER;

  static auto constexpr TAG = "SkiaRenderer";
};

} // namespace vision

#endif
