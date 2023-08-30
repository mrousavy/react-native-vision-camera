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
  _offscreenSurface = nullptr;
  _offscreenSurfaceTextureId = NO_TEXTURE;

  // 3. Delete the Skia context
  if (_skiaContext != nullptr) {
    _skiaContext->abandonContext();
    _skiaContext = nullptr;
  }
}

OpenGLTexture SkiaRenderer::renderFrame(OpenGLContext& glContext, OpenGLTexture& texture) {
  // 1. Activate the OpenGL context (eglMakeCurrent)
  glContext.use();

  // 2. Initialize Skia
  if (_skiaContext == nullptr) {
    GrContextOptions options;
    // TODO: Set this to true or not? idk
    options.fDisableGpuYUVConversion = false;
    _skiaContext = GrDirectContext::MakeGL(options);
  }
  // TODO: use this later kRenderTarget_GrGLBackendState | kTextureBinding_GrGLBackendState
  _skiaContext->resetContext();

  // 3. Create the offscreen Skia Surface
  if (_offscreenSurface == nullptr) {
    GrBackendTexture skiaTex = _skiaContext->createBackendTexture(texture.width,
                                                                  texture.height,
                                                                  SkColorType::kN32_SkColorType,
                                                                  GrMipMapped::kNo,
                                                                  GrRenderable::kYes);
    GrGLTextureInfo info;
    skiaTex.getGLTextureInfo(&info);
    _offscreenSurfaceTextureId = info.fID;

    SkSurfaceProps props(0, kUnknown_SkPixelGeometry);
    _offscreenSurface = SkSurfaces::WrapBackendTexture(_skiaContext.get(),
                                                       skiaTex,
                                                       kBottomLeft_GrSurfaceOrigin,
                                                       0,
                                                       SkColorType::kN32_SkColorType,
                                                       nullptr,
                                                       &props,
                                                       // TODO: Delete texture!
                                                       nullptr);
  }

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


  SkCanvas* canvas = _offscreenSurface->getCanvas();

  canvas->clear(SkColors::kCyan);

  auto duration = std::chrono::system_clock::now().time_since_epoch();
  auto millis = std::chrono::duration_cast<std::chrono::milliseconds>(duration).count();

  canvas->drawImage(frame, 0, 0);

  // TODO: Run Skia Frame Processor
  SkRect rect = SkRect::MakeXYWH(150, 250, millis % 3000 / 10, millis % 3000 / 10);
  SkPaint paint;
  paint.setColor(SkColors::kGreen);
  canvas->drawRect(rect, paint);

  _offscreenSurface->flushAndSubmit();

  OpenGLTexture result {
    .id = _offscreenSurfaceTextureId,
    .target = GL_TEXTURE_2D,
    .width = texture.width,
    .height = texture.height,
  };
  return result;
}

void SkiaRenderer::registerNatives() {
  registerHybrid({
     makeNativeMethod("initHybrid", SkiaRenderer::initHybrid),
  });
}

} // namespace vision

#endif
