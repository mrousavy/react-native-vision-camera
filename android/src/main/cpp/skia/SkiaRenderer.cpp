//
// Created by Marc Rousavy on 10.08.23.
//

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
#define ACTIVE_SURFACE_ID 0

namespace vision {


jni::local_ref<SkiaRenderer::jhybriddata> SkiaRenderer::initHybrid(jni::alias_ref<jhybridobject> javaPart) {
  return makeCxxInstance(javaPart);
}

SkiaRenderer::SkiaRenderer(const jni::alias_ref<jhybridobject>& javaPart) {
  _javaPart = jni::make_global(javaPart);

  __android_log_print(ANDROID_LOG_INFO, TAG, "Initializing SkiaRenderer...");

  _previewSurface = nullptr;
  _previewWidth = 0;
  _previewHeight = 0;
  _inputSurfaceTextureId = NO_INPUT_TEXTURE;
}

SkiaRenderer::~SkiaRenderer() {
  if (_glDisplay != EGL_NO_DISPLAY) {
    eglMakeCurrent(_glDisplay, EGL_NO_SURFACE, EGL_NO_SURFACE, EGL_NO_CONTEXT);
    if (_glSurface != EGL_NO_SURFACE) {
      __android_log_print(ANDROID_LOG_INFO, TAG, "Destroying OpenGL Surface...");
      eglDestroySurface(_glDisplay, _glSurface);
      _glSurface = EGL_NO_SURFACE;
    }
    if (_glContext != EGL_NO_CONTEXT) {
      __android_log_print(ANDROID_LOG_INFO, TAG, "Destroying OpenGL Context...");
      eglDestroyContext(_glDisplay, _glContext);
      _glContext = EGL_NO_CONTEXT;
    }
    __android_log_print(ANDROID_LOG_INFO, TAG, "Destroying OpenGL Display...");
    eglTerminate(_glDisplay);
    _glDisplay = EGL_NO_DISPLAY;
  }
  if (_skiaContext != nullptr) {
    _skiaContext->abandonContext();
    _skiaContext = nullptr;
  }
  destroyOutputSurface();
}

void SkiaRenderer::ensureOpenGL(ANativeWindow* surface) {
  bool successful;
  // EGLDisplay
  if (_glDisplay == EGL_NO_DISPLAY) {
    __android_log_print(ANDROID_LOG_INFO, TAG, "Initializing EGLDisplay..");
    _glDisplay = eglGetDisplay(EGL_DEFAULT_DISPLAY);
    if (_glDisplay == EGL_NO_DISPLAY) throw OpenGLError("Failed to get default OpenGL Display!");

    EGLint major;
    EGLint minor;
    successful = eglInitialize(_glDisplay, &major, &minor);
    if (!successful) throw OpenGLError("Failed to initialize OpenGL!");
  }

  // EGLConfig
  if (_glConfig == nullptr) {
    __android_log_print(ANDROID_LOG_INFO, TAG, "Initializing EGLConfig..");
    EGLint attributes[] = {EGL_RENDERABLE_TYPE, EGL_OPENGL_ES2_BIT,
                           EGL_SURFACE_TYPE, EGL_WINDOW_BIT,
                           EGL_ALPHA_SIZE, 8,
                           EGL_BLUE_SIZE, 8,
                           EGL_GREEN_SIZE, 8,
                           EGL_RED_SIZE, 8,
                           EGL_DEPTH_SIZE, 0,
                           EGL_STENCIL_SIZE, 0,
                           EGL_NONE};
    EGLint numConfigs;
    successful = eglChooseConfig(_glDisplay, attributes, &_glConfig, 1, &numConfigs);
    if (!successful || numConfigs == 0) throw OpenGLError("Failed to choose OpenGL config!");
  }

  // EGLContext
  if (_glContext == EGL_NO_CONTEXT) {
    __android_log_print(ANDROID_LOG_INFO, TAG, "Initializing EGLContext..");
    EGLint contextAttributes[] = {EGL_CONTEXT_CLIENT_VERSION, 2, EGL_NONE};
    _glContext = eglCreateContext(_glDisplay, _glConfig, nullptr, contextAttributes);
    if (_glContext == EGL_NO_CONTEXT) throw OpenGLError("Failed to create OpenGL context!");
  }

  // EGLSurface
  if (_glSurface == EGL_NO_SURFACE) {
    __android_log_print(ANDROID_LOG_INFO, TAG, "Initializing EGLSurface..");
    _glSurface = eglCreateWindowSurface(_glDisplay, _glConfig, surface, nullptr);
    _skiaContext = GrDirectContext::MakeGL();
  }

  successful = eglMakeCurrent(_glDisplay, _glSurface, _glSurface, _glContext);
  if (!successful || eglGetError() != EGL_SUCCESS) throw OpenGLError("Failed to use current OpenGL context!");
}

void SkiaRenderer::setOutputSurface(jobject previewSurface) {
  __android_log_print(ANDROID_LOG_INFO, TAG, "Setting Output Surface..");
  destroyOutputSurface();

  _previewSurface = ANativeWindow_fromSurface(jni::Environment::current(), previewSurface);
  _glSurface = EGL_NO_SURFACE;
}

void SkiaRenderer::destroyOutputSurface() {
  __android_log_print(ANDROID_LOG_INFO, TAG, "Destroying Output Surface..");
  if (_glSurface != EGL_NO_SURFACE) {
    eglDestroySurface(_glDisplay, _glSurface);
    _glSurface = EGL_NO_SURFACE;
    if (_skiaContext != nullptr) {
      _skiaContext->abandonContext();
      _skiaContext = nullptr;
    }
  }
  if (_previewSurface != nullptr) {
    ANativeWindow_release(_previewSurface);
    _previewSurface = nullptr;
  }
}

void SkiaRenderer::setOutputSurfaceSize(int width, int height) {
  _previewWidth = width;
  _previewHeight = height;
}

void SkiaRenderer::setInputTextureSize(int width, int height) {
  _inputWidth = width;
  _inputHeight = height;
}

void SkiaRenderer::renderLatestFrameToPreview() {
  __android_log_print(ANDROID_LOG_INFO, TAG, "renderLatestFrameToPreview()");
  if (_previewSurface == nullptr) {
    throw std::runtime_error("Cannot render latest frame to preview without a preview surface! "
                             "renderLatestFrameToPreview() needs to be called after setPreviewSurface().");
  }
  return;
  if (_inputSurfaceTextureId == NO_INPUT_TEXTURE) {
    throw std::runtime_error("Cannot render latest frame to preview without an input texture! "
                             "renderLatestFrameToPreview() needs to be called after prepareInputTexture().");
  }
  ensureOpenGL(_previewSurface);

  if (_skiaContext == nullptr) {
    _skiaContext = GrDirectContext::MakeGL();
  }
  _skiaContext->resetContext();

  GrGLTextureInfo textureInfo {
    // OpenGL will automatically convert YUV -> RGB because it's an EXTERNAL texture
    .fTarget = GR_GL_TEXTURE_EXTERNAL,
    .fID = _inputSurfaceTextureId,
    .fFormat = GR_GL_RGBA8,
    .fProtected = skgpu::Protected::kNo,
  };
  GrBackendTexture texture(_inputWidth,
                           _inputHeight,
                           GrMipMapped::kNo,
                           textureInfo);
  sk_sp<SkImage> frame = SkImages::AdoptTextureFrom(_skiaContext.get(),
                                                    texture,
                                                    kTopLeft_GrSurfaceOrigin,
                                                    kN32_SkColorType,
                                                    kOpaque_SkAlphaType);

  GrGLFramebufferInfo fboInfo {
    // FBO #0 is the currently active OpenGL Surface (eglMakeCurrent)
    .fFBOID = ACTIVE_SURFACE_ID,
    .fFormat = GR_GL_RGBA8,
    .fProtected = skgpu::Protected::kNo,
  };;
  GrBackendRenderTarget renderTarget(_previewWidth,
                                     _previewHeight,
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

  auto canvas = surface->getCanvas();

  canvas->clear(SkColors::kBlack);

  auto duration = std::chrono::system_clock::now().time_since_epoch();
  auto millis = std::chrono::duration_cast<std::chrono::milliseconds>(duration).count();

  canvas->drawImage(frame, 0, 0);

  // TODO: Run Skia Frame Processor
  auto rect = SkRect::MakeXYWH(150, 250, millis % 3000 / 10, millis % 3000 / 10);
  auto paint = SkPaint();
  paint.setColor(SkColors::kRed);
  canvas->drawRect(rect, paint);

  // Flush
  canvas->flush();

  bool successful = eglSwapBuffers(_glDisplay, _glSurface);
  if (!successful || eglGetError() != EGL_SUCCESS) throw OpenGLError("Failed to swap OpenGL buffers!");
}


void SkiaRenderer::renderCameraFrameToOffscreenCanvas(jni::JByteBuffer yBuffer,
                                                      jni::JByteBuffer uBuffer,
                                                      jni::JByteBuffer vBuffer) {
  __android_log_print(ANDROID_LOG_INFO, TAG, "Begin render...");
  ensureOpenGL(_previewSurface);
  if (_skiaContext == nullptr) {
    _skiaContext = GrDirectContext::MakeGL();
  }
  _skiaContext->resetContext();

  // See https://en.wikipedia.org/wiki/Chroma_subsampling - we're in 4:2:0
  size_t bytesPerRow = sizeof(uint8_t) * _inputWidth;

  SkImageInfo yInfo = SkImageInfo::MakeA8(_inputWidth, _inputHeight);
  SkPixmap yPixmap(yInfo, yBuffer.getDirectAddress(), bytesPerRow);

  SkImageInfo uInfo = SkImageInfo::MakeA8(_inputWidth / 2, _inputHeight / 2);
  SkPixmap uPixmap(uInfo, uBuffer.getDirectAddress(), bytesPerRow / 2);

  SkImageInfo vInfo = SkImageInfo::MakeA8(_inputWidth / 2, _inputHeight / 2);
  SkPixmap vPixmap(vInfo, vBuffer.getDirectAddress(), bytesPerRow / 2);

  SkYUVAInfo info(SkISize::Make(_inputWidth, _inputHeight),
                  SkYUVAInfo::PlaneConfig::kY_U_V,
                  SkYUVAInfo::Subsampling::k420,
                  SkYUVColorSpace::kRec709_Limited_SkYUVColorSpace);
  SkPixmap externalPixmaps[3] = { yPixmap, uPixmap, vPixmap };
  SkYUVAPixmaps pixmaps = SkYUVAPixmaps::FromExternalPixmaps(info, externalPixmaps);

  sk_sp<SkImage> image = SkImages::TextureFromYUVAPixmaps(_skiaContext.get(), pixmaps);








  GrGLFramebufferInfo fboInfo {
      // FBO #0 is the currently active OpenGL Surface (eglMakeCurrent)
      .fFBOID = ACTIVE_SURFACE_ID,
      .fFormat = GR_GL_RGBA8,
      .fProtected = skgpu::Protected::kNo,
  };;
  GrBackendRenderTarget renderTarget(_previewWidth,
                                     _previewHeight,
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

  auto canvas = surface->getCanvas();

  canvas->clear(SkColors::kBlack);

  auto duration = std::chrono::system_clock::now().time_since_epoch();
  auto millis = std::chrono::duration_cast<std::chrono::milliseconds>(duration).count();

  canvas->drawImage(image, 0, 0);

  // TODO: Run Skia Frame Processor
  auto rect = SkRect::MakeXYWH(150, 250, millis % 3000 / 10, millis % 3000 / 10);
  auto paint = SkPaint();
  paint.setColor(SkColors::kRed);
  canvas->drawRect(rect, paint);

  // Flush
  canvas->flush();

  bool successful = eglSwapBuffers(_glDisplay, _glSurface);
  if (!successful || eglGetError() != EGL_SUCCESS) throw OpenGLError("Failed to swap OpenGL buffers!");


  __android_log_print(ANDROID_LOG_INFO, TAG, "Rendered!");
}


void SkiaRenderer::registerNatives() {
  registerHybrid({
     makeNativeMethod("initHybrid", SkiaRenderer::initHybrid),
     makeNativeMethod("setInputTextureSize", SkiaRenderer::setInputTextureSize),
     makeNativeMethod("setOutputSurface", SkiaRenderer::setOutputSurface),
     makeNativeMethod("destroyOutputSurface", SkiaRenderer::destroyOutputSurface),
     makeNativeMethod("setOutputSurfaceSize", SkiaRenderer::setOutputSurfaceSize),
     makeNativeMethod("renderLatestFrameToPreview", SkiaRenderer::renderLatestFrameToPreview),
     makeNativeMethod("renderCameraFrameToOffscreenCanvas", SkiaRenderer::renderCameraFrameToOffscreenCanvas),
  });
}

} // namespace vision
