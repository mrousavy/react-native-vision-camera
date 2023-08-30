//
// Created by Marc Rousavy on 10.08.23.
//

#if VISION_CAMERA_ENABLE_SKIA

#include "SkiaRenderer.h"
#include <android/log.h>
#include "OpenGLError.h"

#include <GLES2/gl2ext.h>

#include <core/SkColorSpace.h>
#include <core/SkCanvas.h>
#include <core/SkYUVAPixmaps.h>

#include <gpu/gl/GrGLInterface.h>
#include <gpu/GrDirectContext.h>
#include <gpu/GrBackendSurface.h>
#include <gpu/ganesh/SkSurfaceGanesh.h>
#include <gpu/ganesh/SkImageGanesh.h>

#include <android/native_window_jni.h>
#include <android/surface_texture_jni.h>

// from <gpu/ganesh/gl/GrGLDefines.h>
#define GR_GL_RGBA8 0x8058

namespace vision {

jni::local_ref<SkiaRenderer::jhybriddata> SkiaRenderer::initHybrid(jni::alias_ref<jhybridobject> javaPart) {
  return makeCxxInstance(javaPart);
}

SkiaRenderer::SkiaRenderer(const jni::alias_ref<jhybridobject>& javaPart) {
  _javaPart = jni::make_global(javaPart);
}

SkiaRenderer::~SkiaRenderer() {
  // 1. Delete the offscreen texture
  if (_offscreenTexture != std::nullopt) {
    glDeleteTextures(1, &_offscreenTexture->id);
  }
  // 2. Delete the offscreen framebuffer
  if (_framebuffer != NO_FRAMEBUFFER) {
    glDeleteFramebuffers(1, &_framebuffer);
  }
  // 3. Delete the Skia context
  if (_skiaContext != nullptr) {
    _skiaContext->abandonContext();
    _skiaContext = nullptr;
  }
}

OpenGLTexture& SkiaRenderer::renderFrame(OpenGLContext& glContext, OpenGLTexture& texture) {
  // 1. Activate the OpenGL context (eglMakeCurrent)
  glContext.use();

  // 3. Create a 2D texture that we're going to render into
  if (_offscreenTexture == std::nullopt || _offscreenTexture->width != texture.width || _offscreenTexture->height != texture.height) {
    // 2.1. If we already have a previous texture, delete it.
    if (_offscreenTexture != std::nullopt) {
      glDeleteTextures(1, &_offscreenTexture->id);
    }
    // 2.2. Create a new 2D texture
    _offscreenTexture = glContext.createTexture(OpenGLTexture::Texture2D, texture.width, texture.height);
    glBindTexture(_offscreenTexture->target, _offscreenTexture->id);
    // 2.3. Resize it to the target width/height
    glTexImage2D(_offscreenTexture->target, 0, GL_RGBA, texture.width, texture.height, 0, GL_RGBA, GL_UNSIGNED_BYTE, nullptr);
  }

  // 2. Initialize Skia
  if (_skiaContext == nullptr) {
    GrContextOptions options;
    // TODO: Set this to true or not? idk
    options.fDisableGpuYUVConversion = false;
    _skiaContext = GrDirectContext::MakeGL(options);
  }
  // TODO: use this later kRenderTarget_GrGLBackendState | kTextureBinding_GrGLBackendState
  _skiaContext->resetContext();

  // 6. Create an SkImage from the OpenGL Texture containing the Camera Frame
  GrGLTextureInfo textureInfo {
      // OpenGL will automatically convert YUV -> RGB because it's an EXTERNAL texture
      .fTarget = texture.target,
      .fID = texture.id,
      .fFormat = GR_GL_RGBA8,
      .fProtected = skgpu::Protected::kNo,
  };
  GrBackendTexture skiaTexture(texture.width,
                               texture.height,
                               GrMipMapped::kNo,
                               textureInfo);
  sk_sp<SkImage> frame = SkImages::BorrowTextureFrom(_skiaContext.get(),
                                                     skiaTexture,
                                                     kBottomLeft_GrSurfaceOrigin,
                                                     kN32_SkColorType,
                                                     kOpaque_SkAlphaType,
                                                     nullptr,
                                                     nullptr);

  // 7. Create an SkSurface (render target) from the OpenGL offscreen Frame Buffer that we want to render to
  GrGLTextureInfo targetTextureInfo {
    .fTarget = _offscreenTexture->target,
    .fID = _offscreenTexture->id,
    .fFormat = GR_GL_RGBA8
  };
  GrBackendTexture targetTexture(_offscreenTexture->width,
                                 _offscreenTexture->height,
                                 GrMipMapped::kNo,
                                 targetTextureInfo);
  SkSurfaceProps props(0, kUnknown_SkPixelGeometry);
  sk_sp<SkSurface> surface = SkSurfaces::WrapBackendTexture(_skiaContext.get(),
                                                            targetTexture,
                                                            kBottomLeft_GrSurfaceOrigin,
                                                            0,
                                                            kN32_SkColorType,
                                                            nullptr,
                                                            &props,
                                                            nullptr);

  // 8. Prepare for Skia drawing
  auto canvas = surface->getCanvas();

  canvas->clear(SkColors::kCyan);

  auto duration = std::chrono::system_clock::now().time_since_epoch();
  auto millis = std::chrono::duration_cast<std::chrono::milliseconds>(duration).count();

  canvas->drawImage(frame, 0, 0);

  // 10. Run Skia Frame Processor
  // TODO: Run Skia Frame Processor
  auto rect = SkRect::MakeXYWH(150, 250, millis % 3000 / 10, millis % 3000 / 10);
  auto paint = SkPaint();
  paint.setColor(SkColors::kGreen);
  canvas->drawRect(rect, paint);

  // 11. Flush Skia operations to OpenGL
  _skiaContext->flushAndSubmit();

  return _offscreenTexture.value();
}

void SkiaRenderer::registerNatives() {
  registerHybrid({
     makeNativeMethod("initHybrid", SkiaRenderer::initHybrid),
  });
}

} // namespace vision

#endif
