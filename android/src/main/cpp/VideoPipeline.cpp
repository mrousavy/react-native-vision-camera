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
  removeFrameProcessorOutputSurface();
  removeRecordingSessionOutputSurface();
  removePreviewOutputSurface();
  // 2. Delete the input textures
  if (_inputTexture != std::nullopt) {
    glDeleteTextures(1, &_inputTexture->id);
  }
  // 3. Destroy all surfaces
  _previewOutput = nullptr;
  _frameProcessorOutput = nullptr;
  _recordingSessionOutput = nullptr;
  _skiaRenderer = nullptr;
  // 4. Destroy the OpenGL context
  _context = nullptr;
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
  _frameProcessorOutput = OpenGLRenderer::CreateWithWindowSurface(_context, window);
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
    SkiaRenderer* skia = _skiaRenderer->cthis();
    OpenGLTexture offscreenTexture = skia->renderTextureToOffscreenSurface(*_context, texture, transformMatrix);

    // 4.2. Now render to all output surfaces!
    if (_previewOutput) {
      __android_log_print(ANDROID_LOG_INFO, TAG, "Rendering to Preview..");
      skia->renderTextureToSurface(*_context, offscreenTexture, _previewOutput->getEGLSurface());
    }
    if (_frameProcessorOutput) {
      __android_log_print(ANDROID_LOG_INFO, TAG, "Rendering to FrameProcessor..");
      skia->renderTextureToSurface(*_context, offscreenTexture, _frameProcessorOutput->getEGLSurface());
    }
    if (_recordingSessionOutput) {
      __android_log_print(ANDROID_LOG_INFO, TAG, "Rendering to RecordingSession..");
      skia->renderTextureToSurface(*_context, offscreenTexture, _recordingSessionOutput->getEGLSurface());
    }
  } else {
    // 4.1. Simply pass-through shader to render the texture to all output EGLSurfaces
    __android_log_print(ANDROID_LOG_INFO, TAG, "Rendering using pass-through OpenGL Shader..");
    if (_previewOutput) {
      __android_log_print(ANDROID_LOG_INFO, TAG, "Rendering to Preview..");
      _previewOutput->renderTextureToSurface(texture, transformMatrix);
    }
    if (_frameProcessorOutput) {
      __android_log_print(ANDROID_LOG_INFO, TAG, "Rendering to FrameProcessor..");
      _frameProcessorOutput->renderTextureToSurface(texture, transformMatrix);
    }
    if (_recordingSessionOutput) {
      __android_log_print(ANDROID_LOG_INFO, TAG, "Rendering to RecordingSession..");
      _recordingSessionOutput->renderTextureToSurface(texture, transformMatrix);
    }
  }
}

void VideoPipeline::setSkiaRenderer(jni::alias_ref<SkiaRenderer::javaobject> skiaRenderer) {
  this->_skiaRenderer = jni::make_global(skiaRenderer);
}

void VideoPipeline::removeSkiaRenderer() {
  this->_skiaRenderer = nullptr;
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
    makeNativeMethod("setSkiaRenderer", VideoPipeline::setSkiaRenderer),
    makeNativeMethod("removeSkiaRenderer", VideoPipeline::removeSkiaRenderer),
  });
}

} // namespace vision
