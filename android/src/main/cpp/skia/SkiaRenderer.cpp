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
#define DEFAULT_FBO 0

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

sk_sp<GrDirectContext> SkiaRenderer::getSkiaContext() {
  if (_skiaContext == nullptr) {
    GrContextOptions options;
    // TODO: Set this to true or not? idk
    options.fDisableGpuYUVConversion = false;
    _skiaContext = GrDirectContext::MakeGL(options);
  }
  return _skiaContext;
}

OpenGLTexture SkiaRenderer::renderFrame(OpenGLContext& glContext, OpenGLTexture& texture) {
  // 1. Activate the OpenGL context (eglMakeCurrent)
  glContext.use();

  // 2. Initialize Skia
  auto skiaContext = getSkiaContext();
  // TODO: use this later kRenderTarget_GrGLBackendState | kTextureBinding_GrGLBackendState
  skiaContext->resetContext();

  // 3. Create the offscreen Skia Surface
  if (_offscreenSurface == nullptr) {
    GrBackendTexture skiaTex = skiaContext->createBackendTexture(texture.width,
                                                                 texture.height,
                                                                 SkColorType::kN32_SkColorType,
                                                                 GrMipMapped::kNo,
                                                                 GrRenderable::kYes);
    GrGLTextureInfo info;
    skiaTex.getGLTextureInfo(&info);
    _offscreenSurfaceTextureId = info.fID;

    SkSurfaceProps props(0, kUnknown_SkPixelGeometry);
    _offscreenSurface = SkSurfaces::WrapBackendTexture(skiaContext.get(),
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
  sk_sp<SkImage> frame = SkImages::BorrowTextureFrom(skiaContext.get(),
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

  return OpenGLTexture {
      .id = _offscreenSurfaceTextureId,
      .target = GL_TEXTURE_2D,
      .width = texture.width,
      .height = texture.height,
  };
}

void SkiaRenderer::renderTextureToSurface(OpenGLContext &glContext, OpenGLTexture &texture, EGLSurface surface) {
  // 1. Activate the OpenGL context (eglMakeCurrent)
  glContext.use(surface);

  // 2. Initialize Skia
  auto skiaContext = getSkiaContext();

  // 3. Create render target for the target output EGLSurface
  GrGLFramebufferInfo fboInfo {
    .fFBOID = DEFAULT_FBO,
    .fFormat = GR_GL_RGBA8
  };

  GLint stencil;
  glGetIntegerv(GL_STENCIL_BITS, &stencil);

  GLint samples;
  glGetIntegerv(GL_SAMPLES, &samples);

  auto colorType = kN32_SkColorType;

  auto maxSamples =
      _skiaContext->maxSurfaceSampleCountForColorType(colorType);

  if (samples > maxSamples) {
    samples = maxSamples;
  }

  __android_log_print(ANDROID_LOG_INFO, TAG, "Create rendertarget");

  GrBackendRenderTarget renderTarget(texture.width, texture.height, samples, stencil,
                                     fboInfo);

  SkSurfaceProps props(0, kUnknown_SkPixelGeometry);

  __android_log_print(ANDROID_LOG_INFO, TAG, "Create surface");

  // Create surface object
  auto skSurface = SkSurfaces::WrapBackendRenderTarget(
      _skiaContext.get(),
      renderTarget, kBottomLeft_GrSurfaceOrigin, colorType, nullptr, &props,
      nullptr, nullptr);

  if (skSurface == nullptr) {
    __android_log_print(ANDROID_LOG_INFO, TAG, "Could not create render target / surface from eglSurface");
    return;

  }
  __android_log_print(ANDROID_LOG_INFO, TAG, "Surface is valid");

  // 4. Wrap the text into an image and render
  GrGLTextureInfo textureInfo {
      // OpenGL will automatically convert YUV -> RGB - if it's an EXTERNAL texture
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

  if (frame == nullptr) {
    __android_log_print(ANDROID_LOG_INFO, TAG, "Texture image is null...");
    return;
  }

  // 5. Render to the canvas!
  auto canvas = skSurface->getCanvas();
  if (canvas == nullptr) {
    __android_log_print(ANDROID_LOG_INFO, TAG, "Canvas is nullptr");
    return;
  }
  canvas->clear(SkColors::kTransparent);
  canvas->drawImage(frame, 0, 0);

  skSurface->flushAndSubmit();

  // 6. Swap buffers!
  glContext.flush();
}

void SkiaRenderer::registerNatives() {
  registerHybrid({
     makeNativeMethod("initHybrid", SkiaRenderer::initHybrid),
  });
}

} // namespace vision

#endif
