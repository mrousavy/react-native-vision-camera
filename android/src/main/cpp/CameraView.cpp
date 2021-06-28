//
// Created by Marc Rousavy on 14.06.21.
//

#include "CameraView.h"

#include <jni.h>
#include <fbjni/fbjni.h>

#include <memory>
#include <string>

namespace vision {

using namespace facebook;
using namespace jni;

using TSelf = local_ref<HybridClass<vision::CameraView>::jhybriddata>;

TSelf CameraView::initHybrid(alias_ref<HybridClass::jhybridobject> jThis) {
    return makeCxxInstance(jThis);
}

void CameraView::registerNatives() {
    registerHybrid({
        makeNativeMethod("initHybrid", CameraView::initHybrid),
        makeNativeMethod("frameProcessorCallback", CameraView::frameProcessorCallback),
    });
}

void CameraView::frameProcessorCallback(const alias_ref<JImageProxy::javaobject>& frame) {
  if (frameProcessor_ == nullptr) {
    __android_log_write(ANDROID_LOG_WARN, TAG, "Frame Processor is null!");
    setEnableFrameProcessor(false);
    return;
  }

  auto frameStrong = make_local(frame);
  try {
    frameProcessor_(frameStrong);
  } catch (const std::exception& exception) {
    // TODO: jsi::JSErrors cannot be caught on Hermes. They crash the entire app.
    auto message = "Frame Processor threw an error! " + std::string(exception.what());
    __android_log_write(ANDROID_LOG_ERROR, TAG, message.c_str());
  }
}

void CameraView::setEnableFrameProcessor(bool enable) {
  if (enable) {
    __android_log_write(ANDROID_LOG_INFO, TAG, "Enabling Frame Processor Callback...");
  } else {
    __android_log_write(ANDROID_LOG_INFO, TAG, "Disabling Frame Processor Callback...");
  }
  static const auto javaMethod = javaPart_->getClass()->getMethod<void(bool)>("setEnableFrameProcessor");
  javaMethod(javaPart_.get(), enable);
}

void CameraView::setFrameProcessor(const FrameProcessor&& frameProcessor) {
  frameProcessor_ = frameProcessor;
  setEnableFrameProcessor(true);
}

void vision::CameraView::unsetFrameProcessor() {
  frameProcessor_ = nullptr;
  setEnableFrameProcessor(false);
}

} // namespace vision
