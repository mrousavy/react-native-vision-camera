//
// Created by Marc Rousavy on 25.08.23.
//

#include "VideoPipeline.h"
#include "OpenGLError.h"

#include <android/native_window_jni.h>
#include <GLES2/gl2.h>
#include <GLES2/gl2ext.h>
#include <EGL/egl.h>

#include "OpenGLTexture.h"
#include "JFrameProcessor.h"

namespace vision {

jni::local_ref<VideoPipeline::jhybriddata> VideoPipeline::initHybrid(jni::alias_ref<jhybridobject> jThis, int width, int height) {
  return makeCxxInstance(jThis, width, height);
}

VideoPipeline::VideoPipeline(jni::alias_ref<jhybridobject> jThis, int width, int height): _javaPart(jni::make_global(jThis)) {
  _width = width;
  _height = height;
  _context = OpenGLContext::CreateWithOffscreenSurface();
}

VideoPipeline::~VideoPipeline() {
  // 1. Remove output surfaces
  removeFrameProcessor();
  removeRecordingSessionOutputSurface();
  removePreviewOutputSurface();
  // 2. Delete the input textures
  if (_inputTexture != std::nullopt) {
    glDeleteTextures(1, &_inputTexture->id);
  }
  // 3. Destroy the OpenGL context
  _context = nullptr;
}

void VideoPipeline::removeFrameProcessor() {
  _frameProcessor = nullptr;
}

void VideoPipeline::setFrameProcessor(jni::alias_ref<JFrameProcessor::javaobject> frameProcessor) {
  _frameProcessor = jni::make_global(frameProcessor);
}

void VideoPipeline::removeRecordingSessionOutputSurface() {
  if (_recordingSessionOutput) _recordingSessionOutput->destroy();
  _recordingSessionOutput = nullptr;
}

void VideoPipeline::setRecordingSessionOutputSurface(jobject surface) {
  // 1. Delete existing output surface
  removeRecordingSessionOutputSurface();

  // 2. Set new output surface if it is not null
  ANativeWindow* window = ANativeWindow_fromSurface(jni::Environment::current(), surface);
  _recordingSessionOutput = OpenGLRenderer::CreateWithWindowSurface(_context, window);
}

void VideoPipeline::removePreviewOutputSurface() {
  if (_previewOutput) _previewOutput->destroy();
  _previewOutput = nullptr;
}

void VideoPipeline::setPreviewOutputSurface(jobject surface) {
  // 1. Delete existing output surface
  removePreviewOutputSurface();

  // 2. Set new output surface if it is not null
  ANativeWindow* window = ANativeWindow_fromSurface(jni::Environment::current(), surface);
  _previewOutput = OpenGLRenderer::CreateWithWindowSurface(_context, window);
}

int VideoPipeline::getInputTextureId() {
  if (_inputTexture == std::nullopt) {
    _inputTexture = _context->createTexture(OpenGLTexture::Type::ExternalOES, _width, _height);
  }
  return static_cast<int>(_inputTexture->id);
}

void VideoPipeline::onBeforeFrame() {
  // 1. Activate the offscreen context
  _context->use();

  // 2. Prepare the external texture so the Camera can render into it
  OpenGLTexture& texture = _inputTexture.value();
  glBindTexture(texture.target, texture.id);
}

void VideoPipeline::onFrame(jni::alias_ref<jni::JArrayFloat> transformMatrixParam) {
  // 1. Activate the offscreen context
  _context->use();

  // 2. Get the OpenGL transform Matrix (transforms, scales, rotations)
  float transformMatrix[16];
  transformMatrixParam->getRegion(0, 16, transformMatrix);

  // 3. Prepare the texture we are going to render
  OpenGLTexture& texture = _inputTexture.value();

  // 4. Render to all outputs!
  if (_skiaRenderer != nullptr) {
    // 4.1. If we have a Skia Frame Processor, render Skia stuff
    //      to a separate offscreen framebuffer which the outputs will then read from
    __android_log_print(ANDROID_LOG_INFO, TAG, "Rendering using Skia..");
    OpenGLTexture offscreenTexture = _skiaRenderer->renderTextureToOffscreenSurface(*_context, texture, transformMatrix);

    // 4.2. Now render to all output surfaces!
    if (_previewOutput) {
      __android_log_print(ANDROID_LOG_INFO, TAG, "Rendering to Preview..");
      _skiaRenderer->renderTextureToSurface(*_context, offscreenTexture, _previewOutput->getEGLSurface());
    }
    if (_recordingSessionOutput) {
      __android_log_print(ANDROID_LOG_INFO, TAG, "Rendering to RecordingSession..");
      _skiaRenderer->renderTextureToSurface(*_context, offscreenTexture, _recordingSessionOutput->getEGLSurface());
    }
  } else {
    // 4.1. Simply pass-through shader to render the texture to all output EGLSurfaces
    __android_log_print(ANDROID_LOG_INFO, TAG, "Rendering using pass-through OpenGL Shader..");
    if (_previewOutput) {
      __android_log_print(ANDROID_LOG_INFO, TAG, "Rendering to Preview..");
      _previewOutput->renderTextureToSurface(texture, transformMatrix);
    }
    if (_recordingSessionOutput) {
      __android_log_print(ANDROID_LOG_INFO, TAG, "Rendering to RecordingSession..");
      _recordingSessionOutput->renderTextureToSurface(texture, transformMatrix);
    }
  }
}

void VideoPipeline::registerNatives() {
  registerHybrid({
    makeNativeMethod("initHybrid", VideoPipeline::initHybrid),
    makeNativeMethod("getInputTextureId", VideoPipeline::getInputTextureId),
    makeNativeMethod("setFrameProcessor", VideoPipeline::setFrameProcessor),
    makeNativeMethod("removeFrameProcessor", VideoPipeline::removeFrameProcessor),
    makeNativeMethod("setPreviewOutputSurface", VideoPipeline::setPreviewOutputSurface),
    makeNativeMethod("removePreviewOutputSurface", VideoPipeline::removePreviewOutputSurface),
    makeNativeMethod("setRecordingSessionOutputSurface", VideoPipeline::setRecordingSessionOutputSurface),
    makeNativeMethod("removeRecordingSessionOutputSurface", VideoPipeline::removeRecordingSessionOutputSurface),
    makeNativeMethod("onBeforeFrame", VideoPipeline::onBeforeFrame),
    makeNativeMethod("onFrame", VideoPipeline::onFrame),
  });
}

} // namespace vision
