//
// Created by Marc Rousavy on 10.08.23.
//

#if VISION_CAMERA_ENABLE_SKIA

#include "SkiaRenderer.h"
#include <android/log.h>
#include "OpenGLError.h"

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
#define GR_GL_TEXTURE_EXTERNAL 0x8D65
#define GR_GL_RGBA8 0x8058

namespace vision {


jni::local_ref<SkiaRenderer::jhybriddata> SkiaRenderer::initHybrid(jni::alias_ref<jhybridobject> javaPart) {
  return makeCxxInstance(javaPart);
}

SkiaRenderer::SkiaRenderer(const jni::alias_ref<jhybridobject>& javaPart) {
  _javaPart = jni::make_global(javaPart);
}

SkiaRenderer::~SkiaRenderer() {
  if (_skiaContext != nullptr) {
    _skiaContext->abandonContext();
    _skiaContext = nullptr;
  }
}


void SkiaRenderer::renderFrame(const OpenGLContext& glContext,
                               GLuint inputTextureId, int inputWidth, int inputHeight,
                               GLuint outputFrameBufferId, int outputWidth, int outputHeight) {
  __android_log_print(ANDROID_LOG_INFO, TAG, "renderLatestFrameToPreview()");

  // 1. Initialize Skia
  if (_skiaContext == nullptr) {
    _skiaContext = GrDirectContext::MakeGL();
  }
  _skiaContext->resetContext();

  // 2. Create an SkImage from the OpenGL Texture containing the Camera Frame
  GrGLTextureInfo textureInfo {
    // OpenGL will automatically convert YUV -> RGB because it's an EXTERNAL texture
    .fTarget = GR_GL_TEXTURE_EXTERNAL,
    .fID = inputTextureId,
    .fFormat = GR_GL_RGBA8,
    .fProtected = skgpu::Protected::kNo,
  };
  GrBackendTexture texture(inputWidth,
                           inputHeight,
                           GrMipMapped::kNo,
                           textureInfo);
  sk_sp<SkImage> frame = SkImages::AdoptTextureFrom(_skiaContext.get(),
                                                    texture,
                                                    kTopLeft_GrSurfaceOrigin,
                                                    kN32_SkColorType,
                                                    kOpaque_SkAlphaType);

  // 3. Create an SkSurface (render target) from the OpenGL offscreen Frame Buffer that we want to render to
  GrGLFramebufferInfo fboInfo {
    .fFBOID = outputFrameBufferId,
    .fFormat = GR_GL_RGBA8,
    .fProtected = skgpu::Protected::kNo,
  };;
  GrBackendRenderTarget renderTarget(outputWidth,
                                     outputHeight,
                                     0,
                                     8,
                                     fboInfo);
  SkSurfaceProps props(0, kUnknown_SkPixelGeometry);
  sk_sp<SkSurface> surface = SkSurfaces::WrapBackendRenderTarget(_skiaContext.get(),
                                                                 renderTarget,
                                                                 kTopLeft_GrSurfaceOrigin,
                                                                 kN32_SkColorType,
                                                                 nullptr,
                                                                 &props);

  __android_log_print(ANDROID_LOG_INFO, TAG, "Rendering %ix%i Frame to %ix%i Preview..", frame->width(), frame->height(), surface->width(), surface->height());

  // 4. Prepare for Skia drawing
  auto canvas = surface->getCanvas();

  canvas->clear(SkColors::kBlack);

  auto duration = std::chrono::system_clock::now().time_since_epoch();
  auto millis = std::chrono::duration_cast<std::chrono::milliseconds>(duration).count();

  // 5. Always draw the Image
  canvas->drawImage(frame, 0, 0);

  // 6. Run Skia Frame Processor
  // TODO: Run Skia Frame Processor
  auto rect = SkRect::MakeXYWH(150, 250, millis % 3000 / 10, millis % 3000 / 10);
  auto paint = SkPaint();
  paint.setColor(SkColors::kRed);
  canvas->drawRect(rect, paint);

  // 7. Flush Skia operations to OpenGL
  canvas->flush();

  // 8. Flush OpenGL operations to GPU
  glContext.flush();
}

void SkiaRenderer::registerNatives() {
  registerHybrid({
     makeNativeMethod("initHybrid", SkiaRenderer::initHybrid),
  });
}

} // namespace vision

#endif
