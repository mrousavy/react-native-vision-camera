//
// Created by Marc Rousavy on 25.08.23.
//

#pragma once

#include <jni.h>
#include <fbjni/fbjni.h>
#include <EGL/egl.h>
#include <android/native_window.h>

namespace vision {

using namespace facebook;

struct GLContext {
  EGLDisplay display = EGL_NO_DISPLAY;
  EGLSurface surface = EGL_NO_SURFACE;
  EGLContext context = EGL_NO_CONTEXT;
  EGLConfig config = nullptr;
};

struct RecordingSessionOutput {
  ANativeWindow* surface = nullptr;
  int width = 0;
  int height = 0;
};

struct FrameProcessorOutput {
  ANativeWindow* surface = nullptr;
};

class VideoPipeline: public jni::HybridClass<VideoPipeline> {
 public:
  static auto constexpr kJavaDescriptor = "Lcom/mrousavy/camera/utils/VideoPipeline;";
  static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jhybridobject> jThis);
  static void registerNatives();

 public:
  ~VideoPipeline();
  void onBeforeFrame();
  void onFrame();
  void setFrameProcessorOutputSurface(jobject surface);
  void removeFrameProcessorOutputSurface();
  void setRecordingSessionOutputSurface(jobject surface, jint width, jint height);
  void removeRecordingSessionOutputSurface();

 private:
  // Private constructor. Use `create(..)` to create new instances.
  explicit VideoPipeline(jni::alias_ref<jhybridobject> jThis);

 private:
  GLContext& getGLContext();
  void setSize(int width, int height);

 private:
  GLContext _context;
  int _width = 0;
  int _height = 0;
  FrameProcessorOutput _frameProcessorOutput;
  RecordingSessionOutput _recordingSessionOutput;

 private:
  friend HybridBase;
  jni::global_ref<javaobject> _javaPart;
  static constexpr auto TAG = "VideoPipeline";
};

} // vision

