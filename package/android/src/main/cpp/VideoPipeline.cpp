//
// Created by Marc Rousavy on 25.08.23.
//

#include "VideoPipeline.h"
#include "OpenGLError.h"

#include <EGL/egl.h>
#include <EGL/eglext.h>
#include <GLES/gl.h>
#include <GLES2/gl2.h>
#include <GLES2/gl2ext.h>
#include <android/hardware_buffer_jni.h>
#include <android/native_window_jni.h>

#include <chrono>

#include "JFrameProcessor.h"
#include "OpenGLTexture.h"

namespace vision {

jni::local_ref<VideoPipeline::jhybriddata> VideoPipeline::initHybrid(jni::alias_ref<jhybridobject> jThis) {
  return makeCxxInstance(jThis);
}

VideoPipeline::VideoPipeline(jni::alias_ref<jhybridobject> jThis) : _javaPart(jni::make_global(jThis)) {
  _context = OpenGLContext::CreateWithOffscreenSurface();
}

VideoPipeline::~VideoPipeline() {
  // 1. Remove output surfaces
  removeRecordingSessionOutputSurface();
  // 2. Delete the input textures
  if (_inputTexture != std::nullopt) {
    glDeleteTextures(1, &_inputTexture->id);
  }
}

void VideoPipeline::removeRecordingSessionOutputSurface() {
  if (_recordingSessionOutput)
    _recordingSessionOutput->destroy();
  _recordingSessionOutput = nullptr;
}

void VideoPipeline::setRecordingSessionOutputSurface(jobject surface) {
  // 1. Delete existing output surface
  removeRecordingSessionOutputSurface();

  // 2. Set new output surface if it is not null
  ANativeWindow* window = ANativeWindow_fromSurface(jni::Environment::current(), surface);
  _recordingSessionOutput = OpenGLRenderer::CreateWithWindowSurface(_context, window);
}

int VideoPipeline::createInputTexture(int width, int height) {
  if (_inputTexture != std::nullopt) {
    glDeleteTextures(1, &_inputTexture->id);
    _inputTexture = std::nullopt;
  }

  _inputTexture = _context->createTexture(OpenGLTexture::Type::ExternalOES, width, height);
  return static_cast<int>(_inputTexture->id);
}

void VideoPipeline::renderHardwareBuffer(jobject hardwareBufferBoxed) {
#if __ANDROID_API__ >= 26
  AHardwareBuffer* hardwareBuffer = AHardwareBuffer_fromHardwareBuffer(jni::Environment::current(), hardwareBufferBoxed);
  AHardwareBuffer_acquire(hardwareBuffer);

  // TODO: Get a transform matrix from the HardwareBuffer caller?
  constexpr float identityMatrix[16] = {1.0f, 0.0f, 0.0f, 0.0f, 0.0f, 1.0f, 0.0f, 0.0f, 0.0f, 0.0f, 1.0f, 0.0f, 0.0f, 0.0f, 0.0f, 1.0f};

  if (_recordingSessionOutput) {
    __android_log_print(ANDROID_LOG_INFO, TAG, "Rendering to RecordingSession..");
    _recordingSessionOutput->renderHardwareBufferToSurface(hardwareBuffer, identityMatrix);
  }

  AHardwareBuffer_release(hardwareBuffer);
#else
  throw std::runtime_error("HardwareBuffer rendering is only supported is minSdk is set to API 26 or higher!");
#endif
}

void VideoPipeline::onBeforeFrame() {
  _context->use();

  glBindTexture(_inputTexture->target, _inputTexture->id);
}

void VideoPipeline::onFrame(jni::alias_ref<jni::JArrayFloat> transformMatrixParam) {
  // Get the OpenGL transform Matrix (transforms, scales, rotations)
  float transformMatrix[16];
  transformMatrixParam->getRegion(0, 16, transformMatrix);

  OpenGLTexture& texture = _inputTexture.value();

  if (_recordingSessionOutput) {
    __android_log_print(ANDROID_LOG_INFO, TAG, "Rendering to RecordingSession..");
    _recordingSessionOutput->renderTextureToSurface(texture, transformMatrix);
  }
}

void VideoPipeline::registerNatives() {
  registerHybrid({makeNativeMethod("initHybrid", VideoPipeline::initHybrid),
                  makeNativeMethod("setRecordingSessionOutputSurface", VideoPipeline::setRecordingSessionOutputSurface),
                  makeNativeMethod("removeRecordingSessionOutputSurface", VideoPipeline::removeRecordingSessionOutputSurface),
                  makeNativeMethod("createInputTexture", VideoPipeline::createInputTexture),
                  makeNativeMethod("onBeforeFrame", VideoPipeline::onBeforeFrame), makeNativeMethod("onFrame", VideoPipeline::onFrame),
                  makeNativeMethod("renderHardwareBuffer", VideoPipeline::renderHardwareBuffer)});
}

} // namespace vision
