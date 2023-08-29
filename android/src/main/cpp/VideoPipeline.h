//
// Created by Marc Rousavy on 25.08.23.
//

#pragma once

#include <jni.h>
#include <fbjni/fbjni.h>
#include <EGL/egl.h>
#include <android/native_window.h>
#include "PassThroughShader.h"
#include "OpenGLContext.h"
#include <memory>

namespace vision {

#define NO_FRAME_BUFFER 0
#define NO_TEXTURE 0

using namespace facebook;

class VideoPipeline: public jni::HybridClass<VideoPipeline> {
 public:
  static auto constexpr kJavaDescriptor = "Lcom/mrousavy/camera/utils/VideoPipeline;";
  static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jhybridobject> jThis);
  static void registerNatives();

 public:
  ~VideoPipeline();

  // -> SurfaceTexture input
  int getInputTextureId();
  void setSize(int width, int height);

  // <- Frame Processor output
  void setFrameProcessorOutputSurface(jobject surface);
  void removeFrameProcessorOutputSurface();

  // <- MediaRecorder output
  void setRecordingSessionOutputSurface(jobject surface);
  void removeRecordingSessionOutputSurface();

  // <- Preview output
  void setPreviewOutputSurface(jobject surface);
  void removePreviewOutputSurface();

  // Frame callbacks
  void onBeforeFrame();
  void onFrame(float rotationDegrees, bool isMirrored);

 private:
  // Private constructor. Use `create(..)` to create new instances.
  explicit VideoPipeline(jni::alias_ref<jhybridobject> jThis);

 private:
  // Input Surface Texture
  GLuint _inputTextureId = NO_TEXTURE;
  int _width = 0;
  int _height = 0;

  // Outputs
  ANativeWindow* _frameProcessorOutput = nullptr;
  ANativeWindow* _recordingSessionOutput = nullptr;
  ANativeWindow* _previewOutput = nullptr;

  // Context
  std::unique_ptr<OpenGLContext> _context = nullptr;

  // OpenGL rendering
  GLuint _offscreenFrameBuffer = NO_FRAME_BUFFER;

 private:
  friend HybridBase;
  jni::global_ref<javaobject> _javaPart;
  static constexpr auto TAG = "VideoPipeline";
};

} // vision

