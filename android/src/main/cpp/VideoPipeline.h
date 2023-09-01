//
// Created by Marc Rousavy on 25.08.23.
//

#pragma once

#include <jni.h>
#include <fbjni/fbjni.h>
#include <EGL/egl.h>
#include <android/native_window.h>
#include <memory>

#include "OpenGLRenderer.h"
#include "OpenGLContext.h"

#include "OpenGLTexture.h"
#include "JFrameProcessor.h"

namespace vision {

using namespace facebook;

class VideoPipeline: public jni::HybridClass<VideoPipeline> {
 public:
  static auto constexpr kJavaDescriptor = "Lcom/mrousavy/camera/utils/VideoPipeline;";
  static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jhybridobject> jThis, int width, int height);
  static void registerNatives();

 public:
  ~VideoPipeline();

  // -> SurfaceTexture input
  int getInputTextureId();

  // <- Frame Processor output
  void setFrameProcessor(jni::alias_ref<JFrameProcessor::javaobject> frameProcessor);
  void removeFrameProcessor();

  // <- MediaRecorder output
  void setRecordingSessionOutputSurface(jobject surface);
  void removeRecordingSessionOutputSurface();

  // <- Preview output
  void setPreviewOutputSurface(jobject surface);
  void removePreviewOutputSurface();

  // Frame callbacks
  void onBeforeFrame();
  void onFrame(jni::alias_ref<jni::JArrayFloat> transformMatrix);

 private:
  // Private constructor. Use `create(..)` to create new instances.
  explicit VideoPipeline(jni::alias_ref<jhybridobject> jThis, int width, int height);
  // Creates a new Frame instance which should be filled with data.
  jni::local_ref<JFrame> createFrame();

 private:
  // Input Surface Texture
  std::optional<OpenGLTexture> _inputTexture;
  int _width = 0;
  int _height = 0;

  // (Optional) Frame Processor that processes frames before they go into output
  jni::global_ref<JFrameProcessor::javaobject> _frameProcessor = nullptr;

  // Output Contexts
  std::shared_ptr<OpenGLContext> _context = nullptr;
  std::unique_ptr<OpenGLRenderer> _recordingSessionOutput = nullptr;
  std::unique_ptr<OpenGLRenderer> _previewOutput = nullptr;

 private:
  friend HybridBase;
  jni::global_ref<javaobject> _javaPart;
  static constexpr auto TAG = "VideoPipeline";
};

} // namespace vision
