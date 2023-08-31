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

OpenGLTexture SkiaRenderer::renderFrame(OpenGLContext& glContext, OpenGLTexture& inputTexture, float* transformMatrix) {
  // 1. Activate the OpenGL context (eglMakeCurrent)
  glContext.use();

  // 2. Initialize Skia
  if (_skiaContext == nullptr) {
    GrContextOptions options;
    // TODO: Set this to true or not? idk
    options.fDisableGpuYUVConversion = false;
    _skiaContext = GrDirectContext::MakeGL(options);
  }

  // 3. Create the offscreen Skia Surface
  if (_offscreenSurface == nullptr) {
    GrBackendTexture skiaTex = _skiaContext->createBackendTexture(inputTexture.width,
                                                                  inputTexture.height,
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
                                                       // TODO: Delete inputTexture!
                                                       nullptr);
  }

  GrGLTextureInfo textureInfo {
      // OpenGL will automatically convert YUV -> RGB because it's an EXTERNAL inputTexture
      .fTarget = inputTexture.target,
      .fID = inputTexture.id,
      .fFormat = GR_GL_RGBA8,
      .fProtected = skgpu::Protected::kNo,
  };
  GrBackendTexture skiaTexture(inputTexture.width,
                               inputTexture.height,
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

  canvas->clear(SkColors::kTransparent);

  auto duration = std::chrono::system_clock::now().time_since_epoch();
  auto millis = std::chrono::duration_cast<std::chrono::milliseconds>(duration).count();

  SkM44 m(transformMatrix[0], transformMatrix[4], transformMatrix[8], transformMatrix[12],
          transformMatrix[1], transformMatrix[5], transformMatrix[9], transformMatrix[13],
          transformMatrix[2], transformMatrix[6], transformMatrix[10], transformMatrix[14],
          transformMatrix[3], transformMatrix[7], transformMatrix[11], transformMatrix[15]);

  canvas->save();
  // canvas->setMatrix(m); -> TODO: Does not work at the moment, probl. something wrong i'm doing.
  canvas->drawImage(frame, 0, 0);
  canvas->restore();

  // TODO: Run Skia Frame Processor
  SkRect rect = SkRect::MakeXYWH(150, 250, millis % 3000 / 10, millis % 3000 / 10);
  SkPaint paint;
  paint.setColor(SkColors::kGreen);
  canvas->drawRect(rect, paint);

  _offscreenSurface->flushAndSubmit();

  OpenGLTexture result {
    .id = _offscreenSurfaceTextureId,
    .target = GL_TEXTURE_2D,
    .width = inputTexture.width,
    .height = inputTexture.height,
  };
  return result;
}

void SkiaRenderer::renderToSurface(OpenGLContext& glContext, OpenGLTexture& texture, EGLSurface glSurface) {
  // 1. Activate the OpenGL context (eglMakeCurrent)
  glContext.use(glSurface);

  // 2. Initialize Skia
  if (_skiaContext == nullptr) {
    GrContextOptions options;
    // TODO: Set this to true or not? idk
    options.fDisableGpuYUVConversion = false;
    _skiaContext = GrDirectContext::MakeGL(options);
  }

  // 3. Create render target for the current egl surface
  // Set up parameters for the render target so that it
  // matches the underlying OpenGL context.
  GrGLFramebufferInfo fboInfo;

  // We pass 0 as the framebuffer id, since the
  // underlying Skia GrGlGpu will read this when wrapping the context in the
  // render target and the GrGlGpu object.
  fboInfo.fFBOID = 0;
  fboInfo.fFormat = 0x8058; // GL_RGBA8

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
