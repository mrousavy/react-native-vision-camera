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

sk_sp<SkSurface> SkiaRenderer::wrapEglSurfaceAsSurface(EGLSurface eglSurface) {
  GLint sampleCnt;
  glGetIntegerv(GL_SAMPLES, &sampleCnt);
  GLint stencilBits;
  glGetIntegerv(GL_STENCIL_BITS, &stencilBits);
  GrGLFramebufferInfo fboInfo {
    // DEFAULT_FBO is FBO0, meaning the default on-screen FBO for that given surface
    .fFBOID = DEFAULT_FBO,
    .fFormat = GR_GL_RGBA8
  };
  EGLint width = 0, height = 0;
  eglQuerySurface(eglGetCurrentDisplay(), eglSurface, EGL_WIDTH, &width);
  eglQuerySurface(eglGetCurrentDisplay(), eglSurface, EGL_HEIGHT, &height);
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
  if (_offscreenSurface == nullptr || _offscreenSurface->width() != width || _offscreenSurface->height() != height) {
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

OpenGLTexture SkiaRenderer::renderTextureToOffscreenSurface(OpenGLContext& glContext,
                                                            OpenGLTexture& texture,
                                                            float* transformMatrix,
                                                            const DrawCallback& drawCallback) {
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

  // TODO: Apply Matrix. No idea how though.
  SkM44 matrix = SkM44::ColMajor(transformMatrix);

  // 6. Render it!
  canvas->clear(SkColors::kBlack);
  canvas->drawImage(frame, 0, 0);

  drawCallback(canvas);

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
  sk_sp<SkSurface> skSurface = wrapEglSurfaceAsSurface(surface);

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

} // namespace vision

#endif
