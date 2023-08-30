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

sk_sp<SkSurface> SkiaRenderer::getSkiaSurface(GLuint frameBufferId, int width, int height) {
  GrGLFramebufferInfo frameBufferInfo {
      .fFBOID = frameBufferId,
      .fFormat = GR_GL_RGBA8,
  };

  GLint sampleCnt;
  glGetIntegerv(GL_SAMPLES, &sampleCnt);
  GLint stencilBits;
  glGetIntegerv(GL_STENCIL_BITS, &stencilBits);

  GrBackendRenderTarget renderTarget(width,
                                     height,
                                     sampleCnt,
                                     stencilBits,
                                     frameBufferInfo);
  SkSurfaceProps props(0, kUnknown_SkPixelGeometry);
  sk_sp<SkSurface> surface = SkSurfaces::WrapBackendRenderTarget(_skiaContext.get(),
                                                                 renderTarget,
                                                                 kBottomLeft_GrSurfaceOrigin,
                                                                 SkColorType::kN32_SkColorType,
                                                                 nullptr,
                                                                 &props,
                                                                 nullptr);
  return surface;
}

sk_sp<SkImage> SkiaRenderer::getSkiaTexture(OpenGLTexture& texture) {
  GrGLTextureInfo textureInfo {
      // OpenGL will automatically convert YUV -> RGB if it's an EXTERNAL texture
      .fTarget = texture.target,
      .fID = texture.id,
      .fFormat = GR_GL_RGBA8,
      .fProtected = skgpu::Protected::kNo,
  };
  GrBackendTexture skiaTexture(texture.width,
                               texture.height,
                               GrMipMapped::kNo,
                               textureInfo);
  sk_sp<SkImage> image = SkImages::BorrowTextureFrom(_skiaContext.get(),
                                                     skiaTexture,
                                                     kBottomLeft_GrSurfaceOrigin,
                                                     kN32_SkColorType,
                                                     kOpaque_SkAlphaType,
                                                     nullptr,
                                                     nullptr);
  return image;
}

sk_sp<SkImage> SkiaRenderer::renderFrame(OpenGLContext& glContext, OpenGLTexture& texture) {
  // 1. Activate the OpenGL context w/ 1x1 pbuffer surface (eglMakeCurrent)
  glContext.use();

  // 2. Initialize Skia
  if (_skiaContext == nullptr) {
    _skiaContext = GrDirectContext::MakeGL();
  }
  // TODO: Do I need that?
  _skiaContext->resetContext();
  _skiaContext->resetGLTextureBindings();

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
    __android_log_print(ANDROID_LOG_INFO, TAG, "Created Texture %i!", info.fID);
    _offscreenSurface = getSkiaSurface(info.fID, texture.width, texture.height);
  }

  sk_sp<SkImage> frame = getSkiaTexture(texture);

  SkCanvas* canvas = _offscreenSurface->getCanvas();

  //canvas->clear(SkColors::kCyan);

  auto duration = std::chrono::system_clock::now().time_since_epoch();
  auto millis = std::chrono::duration_cast<std::chrono::milliseconds>(duration).count();

  canvas->drawImage(frame, 0, 0);

  // TODO: Run Skia Frame Processor
  SkRect rect = SkRect::MakeXYWH(150, 250, millis % 2000 / 10, millis % 2000 / 10);
  SkPaint paint;
  paint.setColor(SkColors::kRed);
  canvas->drawRect(rect, paint);

  _offscreenSurface->flushAndSubmit();

  // TODO: Do I need eglSwapBuffer for the 1x1 pbuffer?
  glContext.flush();

  return _offscreenSurface->makeImageSnapshot();
}


void SkiaRenderer::renderTextureToOutputSurface(OpenGLContext& glContext, sk_sp<SkImage> image, EGLSurface outputSurface) {
  // 1. Activate the OpenGL context for the given output surface (eglMakeCurrent)
  glContext.use(outputSurface);

  // 2. Initialize Skia
  if (_skiaContext == nullptr) {
    _skiaContext = GrDirectContext::MakeGL();
  }
  // TODO: use this later kRenderTarget_GrGLBackendState | kTextureBinding_GrGLBackendState
  _skiaContext->resetContext();
  _skiaContext->resetGLTextureBindings();

  // 3. Wrap the target output surface (FBO0 on this glContext)
  sk_sp<SkSurface> surface = getSkiaSurface(0, image->width(), image->height());

  SkCanvas* canvas = surface->getCanvas();

  //canvas->clear(SkColors::kCyan);

  canvas->drawImage(image, 0, 0);

  // TODO: Remove this
  auto duration = std::chrono::system_clock::now().time_since_epoch();
  auto millis = std::chrono::duration_cast<std::chrono::milliseconds>(duration).count();
  SkRect rect = SkRect::MakeXYWH(150, 250, millis % 3000 / 10, millis % 3000 / 10);
  SkPaint paint;
  paint.setColor(SkColors::kGreen);
  canvas->drawRect(rect, paint);

  // This does eglSwapBuffers()
  _skiaContext->flushAndSubmit();

  // does eglSwapBuffers
  glContext.flush();
}

void SkiaRenderer::registerNatives() {
  registerHybrid({
     makeNativeMethod("initHybrid", SkiaRenderer::initHybrid),
  });
}

} // namespace vision

#endif
