//
// Created by Marc Rousavy on 25.08.23.
//

#include "VideoPipeline.h"
#include "OpenGLError.h"

#include <android/native_window_jni.h>
#include <GLES2/gl2.h>
#include <GLES2/gl2ext.h>
#include <EGL/egl.h>
#include <EGL/eglext.h>
#include <GLES/gl.h>

#include <chrono>

#include "OpenGLTexture.h"
#include "JFrameProcessor.h"
#include "JSkiaFrameProcessor.h"

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

jni::local_ref<JFrame> VideoPipeline::createFrame() {
  static const auto createFrameMethod = javaClassLocal()->getMethod<JFrame()>("createFrame");
  return createFrameMethod(_javaPart);
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
  auto isSkiaFrameProcessor = _frameProcessor != nullptr && _frameProcessor->isInstanceOf(JSkiaFrameProcessor::javaClassStatic());
  if (isSkiaFrameProcessor) {
    // 4.1. If we have a Skia Frame Processor, prepare to render to an offscreen surface using Skia
    jni::global_ref<JSkiaFrameProcessor::javaobject> skiaFrameProcessor = jni::static_ref_cast<JSkiaFrameProcessor::javaobject>(_frameProcessor);
    SkiaRenderer& skiaRenderer = skiaFrameProcessor->cthis()->getSkiaRenderer();
    auto drawCallback = [=](SkCanvas* canvas) {
      // Create a JFrame instance (this uses queues/recycling)
      auto frame = JFrame::create(texture.width,
                                  texture.height,
                                  texture.width * 4,
                                  _context->getCurrentPresentationTime(),
                                  "portrait",
                                  false);

      // Fill the Frame with the contents of the GL surface
      _context->getPixelsOfTexture(texture,
                                   &frame->cthis()->pixelsSize,
                                   &frame->cthis()->pixels);

      // Call the Frame processor with the Frame
      frame->cthis()->incrementRefCount();
      skiaFrameProcessor->cthis()->call(frame, canvas);
      frame->cthis()->decrementRefCount();
    };

    // 4.2. Render to the offscreen surface using Skia
    __android_log_print(ANDROID_LOG_INFO, TAG, "Rendering using Skia..");
    OpenGLTexture offscreenTexture = skiaRenderer.renderTextureToOffscreenSurface(*_context,
                                                                                  texture,
                                                                                  transformMatrix,
                                                                                  drawCallback);

    // 4.3. Now render the result of the offscreen surface to all output surfaces!
    if (_previewOutput) {
      __android_log_print(ANDROID_LOG_INFO, TAG, "Rendering to Preview..");
      skiaRenderer.renderTextureToSurface(*_context, offscreenTexture, _previewOutput->getEGLSurface());
    }
    if (_recordingSessionOutput) {
      __android_log_print(ANDROID_LOG_INFO, TAG, "Rendering to RecordingSession..");
      skiaRenderer.renderTextureToSurface(*_context, offscreenTexture, _recordingSessionOutput->getEGLSurface());
    }
  } else {
    // 4.1. If we have a Frame Processor, call it
    if (_frameProcessor != nullptr) {
      // Create a JFrame instance (this uses queues/recycling)
      auto frame = JFrame::create(texture.width,
                                  texture.height,
                                  texture.width * 4,
                                  _context->getCurrentPresentationTime(),
                                  "portrait",
                                  false);

      // Fill the Frame with the contents of the GL surface
      _context->getPixelsOfTexture(texture,
                                   &frame->cthis()->pixelsSize,
                                   &frame->cthis()->pixels);

      // Call the Frame processor with the Frame
      frame->cthis()->incrementRefCount();
      _frameProcessor->cthis()->call(frame);
      frame->cthis()->decrementRefCount();
    }

    // 4.2. Simply pass-through shader to render the texture to all output EGLSurfaces
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
