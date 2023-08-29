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

namespace vision {

#define NO_FRAME_BUFFER 0
#define NO_TEXTURE 0
#define NO_BUFFER 0

using namespace facebook;

struct SurfaceOutput {
  ANativeWindow* surface = nullptr;
  int width = 0;
  int height = 0;
};

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
  void setRecordingSessionOutputSurface(jobject surface, jint width, jint height);
  void removeRecordingSessionOutputSurface();

  // <- Preview output
  void setPreviewOutputSurface(jobject surface, jint width, jint height);
  void removePreviewOutputSurface();

  // Frame callbacks
  void onBeforeFrame();
  void onFrame(jni::alias_ref<jni::JArrayFloat> transformMatrix, jni::alias_ref<jni::JArrayFloat> rotationMatrix);

 private:
  // Private constructor. Use `create(..)` to create new instances.
  explicit VideoPipeline(jni::alias_ref<jhybridobject> jThis);

 private:
  // Input Surface Texture
  GLuint _inputTextureId = NO_TEXTURE;
  int _width = 0;
  int _height = 0;

  // Outputs
  SurfaceOutput _frameProcessorOutput;
  SurfaceOutput _recordingSessionOutput;
  SurfaceOutput _previewOutput;

  // Context
  OpenGLContext* _context = nullptr;

  // OpenGL rendering
  GLuint _offscreenFrameBuffer = NO_FRAME_BUFFER;
  GLuint _vertexBuffer = NO_BUFFER;
  PassThroughShader* _passThroughShader;

  static auto constexpr MATRIX_SIZE = 16;

 private:
  friend HybridBase;
  jni::global_ref<javaobject> _javaPart;
  static constexpr auto TAG = "VideoPipeline";
};

} // vision

