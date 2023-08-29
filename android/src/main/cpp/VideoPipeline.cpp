//
// Created by Marc Rousavy on 25.08.23.
//

#include "VideoPipeline.h"
#include "OpenGLError.h"

#include <android/native_window_jni.h>
#include <GLES2/gl2.h>
#include <GLES2/gl2ext.h>
#include <EGL/egl.h>

namespace vision {

jni::local_ref<VideoPipeline::jhybriddata> VideoPipeline::initHybrid(jni::alias_ref<jhybridobject> jThis, int width, int height) {
  return makeCxxInstance(jThis, width, height);
}

VideoPipeline::VideoPipeline(jni::alias_ref<jhybridobject> jThis, int width, int height): _javaPart(jni::make_global(jThis)) {
  _width = width;
  _height = height;
  _offscreenContextOutput = OpenGLContext::CreateWithOffscreenSurface(width, height);
}

VideoPipeline::~VideoPipeline() {
  // 1. Remove output surfaces
  removeFrameProcessorOutputSurface();
  removeRecordingSessionOutputSurface();
  removePreviewOutputSurface();
  // 2. Delete the input textures
  if (_inputTextureId != NO_TEXTURE) {
    glDeleteTextures(1, &_inputTextureId);
    _inputTextureId = NO_TEXTURE;
  }
  if (_offscreenFrameBuffer != NO_FRAME_BUFFER) {
    glDeleteFramebuffers(1, &_offscreenFrameBuffer);
    _offscreenFrameBuffer = NO_FRAME_BUFFER;
  }
  // 4. Destroy the OpenGL context
  _offscreenContextOutput = nullptr;
  _previewOutput = nullptr;
  _frameProcessorOutput = nullptr;
  _recordingSessionOutput = nullptr;
}

void VideoPipeline::removeFrameProcessorOutputSurface() {
  if (_frameProcessorOutput) _frameProcessorOutput->destroy();
  _frameProcessorOutput = nullptr;
}

void VideoPipeline::setFrameProcessorOutputSurface(jobject surface) {
  // 1. Delete existing output surface
  removeFrameProcessorOutputSurface();

  // 2. Set new output surface if it is not null
  ANativeWindow* window = ANativeWindow_fromSurface(jni::Environment::current(), surface);
  _frameProcessorOutput = OpenGLContext::CreateWithWindowSurface(window);
}

void VideoPipeline::removeRecordingSessionOutputSurface() {
  if (_recordingSessionOutput) _recordingSessionOutput->destroy();
  _recordingSessionOutput = nullptr;
}

void VideoPipeline::setRecordingSessionOutputSurface(jobject surface) {
  // 1. Delete existing output surface
  removePreviewOutputSurface();

  // 2. Set new output surface if it is not null
  ANativeWindow* window = ANativeWindow_fromSurface(jni::Environment::current(), surface);
  _recordingSessionOutput = OpenGLContext::CreateWithWindowSurface(window);
}

void VideoPipeline::removePreviewOutputSurface() {
  if (_previewOutput) _previewOutput->destroy();
  _previewOutput = nullptr;
}

void VideoPipeline::setPreviewOutputSurface(jobject surface) {
  // 1. Delete existing output surface
  removeRecordingSessionOutputSurface();

  // 2. Set new output surface if it is not null
  ANativeWindow* window = ANativeWindow_fromSurface(jni::Environment::current(), surface);
  _previewOutput = OpenGLContext::CreateWithWindowSurface(window);
}

int VideoPipeline::getInputTextureId() {
  _offscreenContextOutput->use();

  if (_inputTextureId != NO_TEXTURE) return static_cast<int>(_inputTextureId);

  GLuint textureId;
  glGenTextures(1, &textureId);
  glBindTexture(GL_TEXTURE_EXTERNAL_OES, textureId);
  _inputTextureId = textureId;

  return static_cast<int>(_inputTextureId);
}

void VideoPipeline::onBeforeFrame() {
  _offscreenContextOutput->use();

  glBindTexture(GL_TEXTURE_EXTERNAL_OES, _inputTextureId);
}

void VideoPipeline::onFrame(jni::alias_ref<jni::JArrayFloat> transformMatrixParam) {
  _offscreenContextOutput->use();

  float transformMatrix[16];
  transformMatrixParam->getRegion(0, 16, transformMatrix);
  _offscreenContextOutput->renderTextureToSurface(_inputTextureId, transformMatrix);
}

void VideoPipeline::registerNatives() {
  registerHybrid({
    makeNativeMethod("initHybrid", VideoPipeline::initHybrid),
    makeNativeMethod("setFrameProcessorOutputSurface", VideoPipeline::setFrameProcessorOutputSurface),
    makeNativeMethod("removeFrameProcessorOutputSurface", VideoPipeline::removeFrameProcessorOutputSurface),
    makeNativeMethod("setRecordingSessionOutputSurface", VideoPipeline::setRecordingSessionOutputSurface),
    makeNativeMethod("removeRecordingSessionOutputSurface", VideoPipeline::removeRecordingSessionOutputSurface),
    makeNativeMethod("setPreviewOutputSurface", VideoPipeline::setPreviewOutputSurface),
    makeNativeMethod("removePreviewOutputSurface", VideoPipeline::removePreviewOutputSurface),
    makeNativeMethod("getInputTextureId", VideoPipeline::getInputTextureId),
    makeNativeMethod("onBeforeFrame", VideoPipeline::onBeforeFrame),
    makeNativeMethod("onFrame", VideoPipeline::onFrame),
  });
}

} // vision