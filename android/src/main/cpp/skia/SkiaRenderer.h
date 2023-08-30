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

namespace vision {

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
   * @param inputTextureId The input texture (from `glGenTextures`) that holds the Camera frame.
   * @param inputWidth The width of the input texture
   * @param inputHeight The height of the input texture
   * @param outputFrameBufferId The output Frame Buffer (from `glGenFrameBuffers`) that will be used as a render target
   * @param outputWidth The width of the output Frame Buffer
   * @param outputHeight The height of the output Frame Buffer
   */
  void renderFrame(const OpenGLContext& glContext,
                   GLuint inputTextureId, int inputWidth, int inputHeight,
                   GLuint outputFrameBufferId, int outputWidth, int outputHeight);

 private:
  // OpenGL Context
  std::shared_ptr<OpenGLContext> _glContext;
  // Skia Context
  sk_sp<GrDirectContext> _skiaContext;

  static auto constexpr TAG = "SkiaRenderer";
};

} // namespace vision

#endif
