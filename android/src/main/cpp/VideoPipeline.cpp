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

jni::local_ref<VideoPipeline::jhybriddata> VideoPipeline::initHybrid(jni::alias_ref<jhybridobject> jThis) {
  return makeCxxInstance(jThis);
}

VideoPipeline::VideoPipeline(jni::alias_ref<jhybridobject> jThis): _javaPart(jni::make_global(jThis)) { }

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
  if (_context != nullptr) {
    _context->destroy();
  }
}

void VideoPipeline::setSize(int width, int height) {
  _width = width;
  _height = height;
}

void VideoPipeline::removeFrameProcessorOutputSurface() {
  if (_frameProcessorOutput != nullptr) {
    ANativeWindow_release(_frameProcessorOutput);
  }
}

void VideoPipeline::setFrameProcessorOutputSurface(jobject surface) {
  // 1. Delete existing output surface
  removeFrameProcessorOutputSurface();

  // 2. Set new output surface if it is not null
  _frameProcessorOutput = ANativeWindow_fromSurface(jni::Environment::current(), surface);
}

void VideoPipeline::removeRecordingSessionOutputSurface() {
  if (_recordingSessionOutput != nullptr) {
    ANativeWindow_release(_recordingSessionOutput);
  }
}

void VideoPipeline::setRecordingSessionOutputSurface(jobject surface) {
  // 1. Delete existing output surface
  removePreviewOutputSurface();

  // 2. Set new output surface if it is not null
  _previewOutput = ANativeWindow_fromSurface(jni::Environment::current(), surface);
}

void VideoPipeline::removePreviewOutputSurface() {
  if (_previewOutput != nullptr) {
    ANativeWindow_release(_previewOutput);
    _context = nullptr;
  }
}

void VideoPipeline::setPreviewOutputSurface(jobject surface) {
  // 1. Delete existing output surface
  removeRecordingSessionOutputSurface();

  // 2. Set new output surface if it is not null
  _previewOutput = ANativeWindow_fromSurface(jni::Environment::current(), surface);
  _context = OpenGLContext::CreateWithWindowSurface(_previewOutput);
}

int VideoPipeline::getInputTextureId() {
  if (_context == nullptr) throw std::runtime_error("Failed to get input texture ID: The context is not yet ready.");
  _context->use();

  if (_inputTextureId != NO_TEXTURE) return static_cast<int>(_inputTextureId);

  GLuint textureId;
  glGenTextures(1, &textureId);
  glBindTexture(GL_TEXTURE_EXTERNAL_OES, textureId);
  _inputTextureId = textureId;

  return static_cast<int>(_inputTextureId);
}

void VideoPipeline::onBeforeFrame() {
  if (_context == nullptr) throw std::runtime_error("Failed to render a Frame: The context is not yet ready.");
  _context->use();

  glBindTexture(GL_TEXTURE_EXTERNAL_OES, _inputTextureId);
}

void VideoPipeline::onFrame(jni::alias_ref<jni::JArrayFloat> transformMatrixParam) {
  if (_context == nullptr) throw std::runtime_error("Failed to render a Frame: The context is not yet ready.");

  float transformMatrix[16];
  transformMatrixParam->getRegion(0, 16, transformMatrix);
  _context->renderTextureToSurface(_inputTextureId, transformMatrix);
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