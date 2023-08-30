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

OpenGLTexture& SkiaRenderer::renderFrame(OpenGLContext& glContext, OpenGLTexture& inputTexture, int width, int height) {
  // 1. Initialize Skia
  if (_skiaContext == nullptr) {
    _skiaContext = GrDirectContext::MakeGL();
  }
  _skiaContext->resetContext();

  // 2. Create a 2D texture that we're going to render into
  if (_framebuffer == NO_FRAMEBUFFER || _offscreenTexture == std::nullopt || _offscreenTexture->width != width || _offscreenTexture->height != height) {
    // 2.1. If we already have a previous texture, delete it.
    if (_offscreenTexture != std::nullopt) {
      glDeleteTextures(1, &_offscreenTexture->id);
    }
    // 2.2. Create a new 2D texture
    _offscreenTexture = glContext.createTexture(OpenGLTexture::Texture2D, width, height);
    glBindTexture(_offscreenTexture->target, _offscreenTexture->id);
    // 2.3. Resize it to the target width/height
    glTexImage2D(_offscreenTexture->target, 0, GL_RGBA, width, height, 0, GL_RGBA, GL_UNSIGNED_BYTE, nullptr);

    // 2.4. If we already have a previous frame buffer, delete it.
    if (_framebuffer != NO_FRAMEBUFFER) {
      glDeleteFramebuffers(1, &_framebuffer);
    }
    // 2.5. Create a Frame Buffer that will be used to render into this texture
    glGenFramebuffers(1, &_framebuffer);
    glBindFramebuffer(GL_FRAMEBUFFER, _framebuffer);
    // 2.6. Bind the texture to the Frame Buffer
    glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, _offscreenTexture->target, _offscreenTexture->id, 0);
    if (glCheckFramebufferStatus(GL_FRAMEBUFFER) != GL_FRAMEBUFFER_COMPLETE) {
      throw std::runtime_error("Failed to create Skia Frame Buffer to render into!");
    }
  }

  // 3. Create an SkImage from the OpenGL Texture containing the Camera Frame
  glBindTexture(inputTexture.target, inputTexture.id);
  GrGLTextureInfo textureInfo {
    // OpenGL will automatically convert YUV -> RGB because it's an EXTERNAL texture
    .fTarget = inputTexture.target,
    .fID = inputTexture.id,
    .fFormat = GR_GL_RGBA8,
    .fProtected = skgpu::Protected::kNo,
  };
  GrBackendTexture texture(width,
                           height,
                           GrMipMapped::kNo,
                           textureInfo);
  sk_sp<SkImage> frame = SkImages::AdoptTextureFrom(_skiaContext.get(),
                                                    texture,
                                                    kTopLeft_GrSurfaceOrigin,
                                                    kN32_SkColorType,
                                                    kOpaque_SkAlphaType);

  // 4. Create an SkSurface (render target) from the OpenGL offscreen Frame Buffer that we want to render to
  glBindFramebuffer(GL_FRAMEBUFFER, _framebuffer);
  GrGLFramebufferInfo fboInfo {
    .fFBOID = _framebuffer,
    .fFormat = GR_GL_RGBA8,
    .fProtected = skgpu::Protected::kNo,
  };;
  GrBackendRenderTarget renderTarget(width,
                                     height,
                                     0,
                                     8,
                                     fboInfo);
  SkSurfaceProps props(0, kUnknown_SkPixelGeometry);
  sk_sp<SkSurface> surface = SkSurfaces::WrapBackendRenderTarget(_skiaContext.get(),
                                                                 renderTarget,
                                                                 kBottomLeft_GrSurfaceOrigin,
                                                                 kN32_SkColorType,
                                                                 SkColorSpace::MakeSRGB(),
                                                                 nullptr);

  __android_log_print(ANDROID_LOG_INFO, TAG, "Rendering %ix%i (#%i) Texture to %ix%i (#%i) output Frame Buffer..",
                      frame->width(), frame->height(), inputTexture.id, surface->width(), surface->height(), _framebuffer);

  // 5. Prepare for Skia drawing
  auto canvas = surface->getCanvas();

  canvas->clear(SkColors::kRed);

  auto duration = std::chrono::system_clock::now().time_since_epoch();
  auto millis = std::chrono::duration_cast<std::chrono::milliseconds>(duration).count();

  // 6. Always draw the Image
  canvas->drawImage(frame, 0, 0);

  // 7. Run Skia Frame Processor
  // TODO: Run Skia Frame Processor
  auto rect = SkRect::MakeXYWH(150, 250, millis % 3000 / 10, millis % 3000 / 10);
  auto paint = SkPaint();
  paint.setColor(SkColors::kRed);
  canvas->drawRect(rect, paint);

  // 8. Flush Skia operations to OpenGL
  _skiaContext->flushAndSubmit();

  // 9. Flush OpenGL operations to GPU
  //_skiaContext->flush();

  return _offscreenTexture.value();
}

void SkiaRenderer::registerNatives() {
  registerHybrid({
     makeNativeMethod("initHybrid", SkiaRenderer::initHybrid),
  });
}

} // namespace vision

#endif
