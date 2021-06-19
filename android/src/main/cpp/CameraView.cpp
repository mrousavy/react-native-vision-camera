//
// Created by Marc Rousavy on 14.06.21.
//

#include "CameraView.h"
#include <memory>
#include <jni.h>
#include <fbjni/fbjni.h>

namespace vision {

using namespace facebook;
using namespace jni;

using self = local_ref<HybridClass<vision::CameraView>::jhybriddata>;

self CameraView::initHybrid(alias_ref <HybridClass::jhybridobject> jThis) {
    return makeCxxInstance(jThis);
}

void CameraView::registerNatives() {
    registerHybrid({
        makeNativeMethod("initHybrid", CameraView::initHybrid),
        makeNativeMethod("frameProcessorCallback", CameraView::frameProcessorCallback),
    });
}

void CameraView::frameProcessorCallback(alias_ref<JImageProxy> frame) {
  if (frameProcessor_ == nullptr) {
    __android_log_write(ANDROID_LOG_WARN, TAG, "Frame Processor is null!");
    return;
  }

  local_ref<JImageProxy> frameStrong = make_local(frame);
  __android_log_write(ANDROID_LOG_INFO, TAG, "Calling Frame Processor...");
  frameProcessor_(frameStrong);
}

void CameraView::setFrameProcessor(const FrameProcessor&& frameProcessor) {
  frameProcessor_ = frameProcessor;
}

void vision::CameraView::unsetFrameProcessor() {
  frameProcessor_ = nullptr;
}

} // namespace vision
