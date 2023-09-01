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
  static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jhybridobject> jThis, int width, int height);
  static void registerNatives();

public:
  ~VideoPipeline();

  // -> SurfaceTexture input
  int getInputTextureId();

  // <- Frame Processor output
  void setFrameProcessorOutputSurface(jobject surface);
  void removeFrameProcessorOutputSurface();

  // <- MediaRecorder output
  void setRecordingSessionOutputSurface(jobject surface);
  void removeRecordingSessionOutputSurface();

  // Frame callbacks
  void onBeforeFrame();
  void onFrame(jni::alias_ref<jni::JArrayFloat> transformMatrix);

private:
  // Private constructor. Use `create(..)` to create new instances.
  explicit VideoPipeline(jni::alias_ref<jhybridobject> jThis, int width, int height);

private:
  // Input Surface Texture
  std::optional<OpenGLTexture> _inputTexture = std::nullopt;
  int _width = 0;
  int _height = 0;

  // Output Contexts
  std::shared_ptr<OpenGLContext> _context = nullptr;
  std::unique_ptr<OpenGLRenderer> _frameProcessorOutput = nullptr;
  std::unique_ptr<OpenGLRenderer> _recordingSessionOutput = nullptr;

private:
  friend HybridBase;
  jni::global_ref<javaobject> _javaPart;
  static constexpr auto TAG = "VideoPipeline";
};

} // namespace vision
