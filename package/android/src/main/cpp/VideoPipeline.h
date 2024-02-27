//
// Created by Marc Rousavy on 25.08.23.
//

#pragma once

#include "OpenGLContext.h"
#include "OpenGLRenderer.h"
#include "PassThroughShader.h"
#include <EGL/egl.h>
#include <android/native_window.h>
#include <fbjni/fbjni.h>
#include <jni.h>
#include <memory>
#include <optional>

namespace vision {

using namespace facebook;

class VideoPipeline : public jni::HybridClass<VideoPipeline> {

public:
  static auto constexpr kJavaDescriptor = "Lcom/mrousavy/camera/core/VideoPipeline;";
  static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jhybridobject> jThis);
  static void registerNatives();

public:
  ~VideoPipeline();

  // -> SurfaceTexture input
  int createInputTexture(int width, int height);

  // <- MediaRecorder output
  void setRecordingSessionOutputSurface(jobject surface);
  void removeRecordingSessionOutputSurface();

  // Frame callbacks
  void onBeforeFrame();
  void onFrame(jni::alias_ref<jni::JArrayFloat> transformMatrix);

  void renderHardwareBuffer(jobject hardwareBufferBoxed);

private:
  // Private constructor. Use `create(..)` to create new instances.
  explicit VideoPipeline(jni::alias_ref<jhybridobject> jThis);

private:
  // Input Surface Texture
  std::optional<OpenGLTexture> _inputTexture = std::nullopt;

  // Output Contexts
  std::shared_ptr<OpenGLContext> _context = nullptr;
  std::unique_ptr<OpenGLRenderer> _recordingSessionOutput = nullptr;

private:
  friend HybridBase;
  jni::global_ref<javaobject> _javaPart;
  static constexpr auto TAG = "VideoPipeline";
};

} // namespace vision
