//
// Created by Marc Rousavy on 10.08.23.
//

#pragma once

#include <jni.h>
#include <fbjni/fbjni.h>

#include <GLES2/gl2.h>
#include <EGL/egl.h>
#include <include/core/SkSurface.h>
#include <android/native_window.h>

namespace vision {

using namespace facebook;

class SkiaRenderer: public jni::HybridClass<SkiaRenderer> {
  // JNI Stuff
 public:
  static auto constexpr kJavaDescriptor = "Lcom/mrousavy/camera/skia/SkiaRenderer;";
  static void registerNatives();
 private:
  friend HybridBase;
  jni::global_ref<SkiaRenderer::javaobject> _javaPart;
  explicit SkiaRenderer(const jni::alias_ref<jhybridobject>& javaPart);

 public:
  static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jhybridobject> javaPart);
  ~SkiaRenderer();

 private:
  // Input Texture (Camera)
  int prepareInputTexture();
  // Output Surface (Preview)
  void setPreviewSurface(jobject previewSurface);
  void destroyPreviewSurface();
  void setPreviewSurfaceSize(int width, int height);

  /**
   * Renders the latest Camera Frame from the Input Texture onto the Preview Surface. (60 FPS)
   */
  void renderLatestFrameToPreview();
  /**
   * Renders the latest Camera Frame into it's Input Texture and run the Skia Frame Processor (1..240 FPS)
   */
  void renderCameraFrameToOffscreenCanvas();

 private:
  // OpenGL Context
  EGLContext _glContext = EGL_NO_CONTEXT;
  EGLDisplay _glDisplay = EGL_NO_DISPLAY;
  EGLSurface _glSurface = EGL_NO_SURFACE;
  EGLConfig  _glConfig  = nullptr;
  // Skia Context
  sk_sp<GrDirectContext> _skiaContext;

  // Input Texture (Camera/Offscreen)
  GLuint _inputSurfaceTextureId;
  // Output Texture (Surface/Preview)
  ANativeWindow* _previewSurface;
  int _previewWidth, _previewHeight;

  void ensureOpenGL(ANativeWindow* surface);

  static auto constexpr TAG = "SkiaRenderer";
};

} // namespace vision
