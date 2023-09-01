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
#include <android/native_window_jni.h>

#include <chrono>

#include "JFrameProcessor.h"
#include "OpenGLTexture.h"

namespace vision {

jni::local_ref<VideoPipeline::jhybriddata> VideoPipeline::initHybrid(jni::alias_ref<jhybridobject> jThis, int width, int height) {
  return makeCxxInstance(jThis, width, height);
}

VideoPipeline::VideoPipeline(jni::alias_ref<jhybridobject> jThis, int width, int height) : _javaPart(jni::make_global(jThis)) {
  _width = width;
  _height = height;
  _context = OpenGLContext::CreateWithOffscreenSurface();
}

VideoPipeline::~VideoPipeline() {
  // 1. Remove output surfaces
  removeFrameProcessorOutputSurface();
  removeRecordingSessionOutputSurface();
  // 2. Delete the input textures
  if (_inputTexture != std::nullopt) {
    glDeleteTextures(1, &_inputTexture->id);
    _inputTexture = std::nullopt;
  }
  // 3. Destroy the OpenGL context
  _context = nullptr;
}

void VideoPipeline::removeFrameProcessorOutputSurface() {
  if (_frameProcessorOutput)
    _frameProcessorOutput->destroy();
  _frameProcessorOutput = nullptr;
}

void VideoPipeline::setFrameProcessorOutputSurface(jobject surface) {
  // 1. Delete existing output surface
  removeFrameProcessorOutputSurface();

  // 2. Set new output surface if it is not null
  ANativeWindow* window = ANativeWindow_fromSurface(jni::Environment::current(), surface);
  _frameProcessorOutput = OpenGLRenderer::CreateWithWindowSurface(_context, window);
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

int VideoPipeline::getInputTextureId() {
  if (_inputTexture == std::nullopt) {
    _inputTexture = _context->createTexture(OpenGLTexture::Type::ExternalOES, _width, _height);
  }

  return static_cast<int>(_inputTexture->id);
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

  if (_frameProcessorOutput) {
    __android_log_print(ANDROID_LOG_INFO, TAG, "Rendering to FrameProcessor..");
    _frameProcessorOutput->renderTextureToSurface(texture, transformMatrix);
  }
  if (_recordingSessionOutput) {
    __android_log_print(ANDROID_LOG_INFO, TAG, "Rendering to RecordingSession..");
    _recordingSessionOutput->renderTextureToSurface(texture, transformMatrix);
  }
}

void VideoPipeline::registerNatives() {
  registerHybrid({
      makeNativeMethod("initHybrid", VideoPipeline::initHybrid),
      makeNativeMethod("setFrameProcessorOutputSurface", VideoPipeline::setFrameProcessorOutputSurface),
      makeNativeMethod("removeFrameProcessorOutputSurface", VideoPipeline::removeFrameProcessorOutputSurface),
      makeNativeMethod("setRecordingSessionOutputSurface", VideoPipeline::setRecordingSessionOutputSurface),
      makeNativeMethod("removeRecordingSessionOutputSurface", VideoPipeline::removeRecordingSessionOutputSurface),
      makeNativeMethod("getInputTextureId", VideoPipeline::getInputTextureId),
      makeNativeMethod("onBeforeFrame", VideoPipeline::onBeforeFrame),
      makeNativeMethod("onFrame", VideoPipeline::onFrame),
  });
}

} // namespace vision
