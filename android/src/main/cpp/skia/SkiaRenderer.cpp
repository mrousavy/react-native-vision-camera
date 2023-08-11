//
// Created by Marc Rousavy on 10.08.23.
//

#include "SkiaRenderer.h"
#include <android/log.h>
#include "OpenGLError.h"

#include <core/SkColorSpace.h>
#include <core/SkCanvas.h>

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
  __android_log_print(ANDROID_LOG_INFO, TAG, "setPreviewSurface()");
  destroyOutputSurface();

  _previewSurface = ANativeWindow_fromSurface(jni::Environment::current(), previewSurface);
  _glSurface = EGL_NO_SURFACE;
  __android_log_print(ANDROID_LOG_INFO, TAG, "Set Preview Surface!");
}

void SkiaRenderer::destroyOutputSurface() {
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

int SkiaRenderer::prepareInputTexture() {
  __android_log_print(ANDROID_LOG_INFO, TAG, "prepareInputTexture()");
  if (_previewSurface == nullptr) {
    throw std::runtime_error("Cannot prepare input texture without an output texture! "
                             "prepareInputTexture() needs to be called after setPreviewSurface().");
  }
  ensureOpenGL(_previewSurface);

  GLuint textures[1] {0};
  glGenTextures(1, textures);
  if (glGetError() != GL_NO_ERROR) throw OpenGLError("Failed to create OpenGL Texture!");
  _inputSurfaceTextureId = textures[0];
  __android_log_print(ANDROID_LOG_INFO, TAG, "Created input texture ID! %i", _inputSurfaceTextureId);
  return static_cast<int>(_inputSurfaceTextureId);
}

void SkiaRenderer::renderLatestFrameToPreview() {
  __android_log_print(ANDROID_LOG_INFO, TAG, "renderLatestFrameToPreview()");
  if (_previewSurface == nullptr) {
    throw std::runtime_error("Cannot render latest frame to preview without a preview surface! "
                             "renderLatestFrameToPreview() needs to be called after setPreviewSurface().");
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
  GrBackendTexture texture(4000,
                           2256,
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


void SkiaRenderer::renderCameraFrameToOffscreenCanvas() {
  __android_log_print(ANDROID_LOG_INFO, TAG, "renderCameraFrameToOffscreenCanvas()");
}


void SkiaRenderer::registerNatives() {
  registerHybrid({
     makeNativeMethod("initHybrid", SkiaRenderer::initHybrid),
     makeNativeMethod("prepareInputTexture", SkiaRenderer::prepareInputTexture),
     makeNativeMethod("setOutputSurface", SkiaRenderer::setOutputSurface),
     makeNativeMethod("destroyOutputSurface", SkiaRenderer::destroyOutputSurface),
     makeNativeMethod("setOutputSurfaceSize", SkiaRenderer::setOutputSurfaceSize),
     makeNativeMethod("renderLatestFrameToPreview", SkiaRenderer::renderLatestFrameToPreview),
     makeNativeMethod("renderCameraFrameToOffscreenCanvas", SkiaRenderer::renderCameraFrameToOffscreenCanvas),
  });
}

} // namespace vision