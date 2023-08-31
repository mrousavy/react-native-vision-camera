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
    _skiaContext = GrDirectContext::MakeGL();
  }
  return _skiaContext;
}

sk_sp<SkImage> SkiaRenderer::wrapTextureAsImage(OpenGLTexture &texture) {
  GrGLTextureInfo textureInfo {
      // OpenGL will automatically convert YUV -> RGB - if it's an EXTERNAL texture
      .fTarget = texture.target,
      .fID = texture.id,
      .fFormat = GR_GL_RGBA8,
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
  if (image == nullptr) {
    [[unlikely]];
    throw std::runtime_error("Failed to create Skia Image! Cannot wrap input texture (frame) using Skia.");
  }
  return image;
}

sk_sp<SkSurface> SkiaRenderer::wrapFrameBufferAsSurface(GLuint frameBufferId, int width, int height) {
  GLint sampleCnt;
  glGetIntegerv(GL_SAMPLES, &sampleCnt);
  GLint stencilBits;
  glGetIntegerv(GL_STENCIL_BITS, &stencilBits);
  GrGLFramebufferInfo fboInfo {
      .fFBOID = frameBufferId,
      .fFormat = GR_GL_RGBA8
  };
  GrBackendRenderTarget renderTarget(width,
                                     height,
                                     sampleCnt,
                                     stencilBits,
                                     fboInfo);
  SkSurfaceProps props(0, kUnknown_SkPixelGeometry);
  sk_sp<SkSurface> surface = SkSurfaces::WrapBackendRenderTarget(_skiaContext.get(),
                                                                 renderTarget,
                                                                 kBottomLeft_GrSurfaceOrigin,
                                                                 kN32_SkColorType,
                                                                 nullptr,
                                                                 &props,
                                                                 nullptr,
                                                                 nullptr);
  if (surface == nullptr) {
    [[unlikely]];
    throw std::runtime_error("Failed to create Skia Surface! Cannot wrap EGLSurface/FrameBuffer using Skia.");
  }
  return surface;
}

sk_sp<SkSurface> SkiaRenderer::getOffscreenSurface(int width, int height) {
  if (_offscreenSurface == nullptr) {
    // 1. Get Skia Context
    sk_sp<GrDirectContext> skiaContext = getSkiaContext();

    // 2. Create a backend texture (TEXTURE_2D + Frame Buffer)
    GrBackendTexture backendTexture = skiaContext->createBackendTexture(width,
                                                                        height,
                                                                        SkColorType::kN32_SkColorType,
                                                                        GrMipMapped::kNo,
                                                                        GrRenderable::kYes);

    // 3. Get it's Texture ID
    GrGLTextureInfo info;
    backendTexture.getGLTextureInfo(&info);
    _offscreenSurfaceTextureId = info.fID;

    struct ReleaseContext {
      GrDirectContext* context;
      GrBackendTexture texture;
    };
    auto releaseCtx = new ReleaseContext(
        {skiaContext.get(), backendTexture});
    SkSurfaces::TextureReleaseProc releaseProc = [] (void* address) {
      // 5. Once done using, delete the backend OpenGL texture.
      auto releaseCtx = reinterpret_cast<ReleaseContext*>(address);
      releaseCtx->context->deleteBackendTexture(releaseCtx->texture);
    };

    // 4. Wrap the newly created texture as an SkSurface
    SkSurfaceProps props(0, kUnknown_SkPixelGeometry);
    _offscreenSurface = SkSurfaces::WrapBackendTexture(skiaContext.get(),
                                                       backendTexture,
                                                       kBottomLeft_GrSurfaceOrigin,
                                                       0,
                                                       SkColorType::kN32_SkColorType,
                                                       nullptr,
                                                       &props,
                                                       releaseProc,
                                                       releaseCtx);
    if (_offscreenSurface == nullptr) {
      [[unlikely]];
      throw std::runtime_error("Failed to create offscreen Skia Surface!");
    }
  }

  return _offscreenSurface;
}

OpenGLTexture SkiaRenderer::renderTextureToOffscreenSurface(OpenGLContext& glContext, OpenGLTexture& texture, float* transformMatrix) {
  // 1. Activate the OpenGL context (eglMakeCurrent)
  glContext.use();

  // 2. Initialize Skia
  sk_sp<GrDirectContext> skiaContext = getSkiaContext();

  // 3. Create the offscreen Skia Surface
  sk_sp<SkSurface> surface = getOffscreenSurface(texture.width, texture.height);

  // 4. Wrap the input texture as an image so we can draw it to the surface
  sk_sp<SkImage> frame = wrapTextureAsImage(texture);

  // 5. Prepare the Canvas
  SkCanvas* canvas = _offscreenSurface->getCanvas();
  if (canvas == nullptr) {
    [[unlikely]];
    throw std::runtime_error("Failed to get Skia Canvas!");
  }

  SkM44 matrix(
      transformMatrix[0], transformMatrix[4], transformMatrix[8], transformMatrix[12],
      transformMatrix[1], transformMatrix[5], transformMatrix[9], transformMatrix[13],
      transformMatrix[2], transformMatrix[6], transformMatrix[10], transformMatrix[14],
      transformMatrix[3], transformMatrix[7], transformMatrix[11], transformMatrix[15]
  );
  auto prevMatrix = canvas->getLocalToDevice();

  // 6. Render it!
  canvas->clear(SkColors::kBlack);

  canvas->setMatrix(matrix);

  canvas->drawImage(frame, 0, 0);

  canvas->setMatrix(prevMatrix);

  // 7. Call JS Skia Frame Processor for additional drawing operations
  auto duration = std::chrono::system_clock::now().time_since_epoch();
  auto millis = std::chrono::duration_cast<std::chrono::milliseconds>(duration).count();
  SkRect rect = SkRect::MakeXYWH(150, 250, millis % 3000 / 10, millis % 3000 / 10);
  SkPaint paint;
  paint.setColor(SkColors::kGreen);
  canvas->drawRect(rect, paint);

  // 8. Flush all Skia operations to OpenGL
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
  sk_sp<GrDirectContext> skiaContext = getSkiaContext();

  // 3. Wrap the output EGLSurface in a Skia SkSurface
  sk_sp<SkSurface> skSurface = wrapFrameBufferAsSurface(DEFAULT_FBO, texture.width, texture.height);

  // 4. Wrap the input texture in a Skia SkImage
  sk_sp<SkImage> frame = wrapTextureAsImage(texture);

  // 5. Prepare the Canvas!
  SkCanvas* canvas = skSurface->getCanvas();
  if (canvas == nullptr) {
    [[unlikely]];
    throw std::runtime_error("Failed to get Skia Canvas!");
  }

  // 6. Render it!
  canvas->clear(SkColors::kBlack);
  canvas->drawImage(frame, 0, 0);

  // 7. Flush all Skia operations to OpenGL
  skSurface->flushAndSubmit();

  // 8. Swap the buffers so the onscreen surface gets updated.
  glContext.flush();
}

void SkiaRenderer::registerNatives() {
  registerHybrid({
     makeNativeMethod("initHybrid", SkiaRenderer::initHybrid),
  });
}

} // namespace vision

#endif
