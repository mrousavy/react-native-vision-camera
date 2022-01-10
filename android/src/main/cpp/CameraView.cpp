//
// Created by Marc Rousavy on 14.06.21.
//

#include "CameraView.h"

#include <jni.h>
#include <fbjni/fbjni.h>
#include <jsi/jsi.h>

#include <memory>
#include <string>
#include <regex>

namespace vision {

using namespace facebook;
using namespace jni;

using TSelf = local_ref<CameraView::jhybriddata>;

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
    __android_log_write(ANDROID_LOG_WARN, TAG, "Called Frame Processor callback, but `frameProcessor` is null!");
    return;
  }

  try {
    frameProcessor_(frame);
  } catch (const jsi::JSError& error) {
    // TODO: jsi::JSErrors cannot be caught on Hermes. They crash the entire app.
    auto stack = std::regex_replace(error.getStack(), std::regex("\n"), "\n    ");
    __android_log_print(ANDROID_LOG_ERROR, TAG, "Frame Processor threw an error! %s\nIn: %s", error.getMessage().c_str(), stack.c_str());
  } catch (const std::exception& exception) {
    __android_log_print(ANDROID_LOG_ERROR, TAG, "Frame Processor threw a C++ error! %s", exception.what());
  }
}

void CameraView::setFrameProcessor(const TFrameProcessor&& frameProcessor) {
  frameProcessor_ = frameProcessor;
}

void vision::CameraView::unsetFrameProcessor() {
  frameProcessor_ = nullptr;
}

} // namespace vision
