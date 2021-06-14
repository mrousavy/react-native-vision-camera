//
// Created by Marc Rousavy on 14.06.21.
//

#include "CameraView.h"
#include <fbjni/fbjni.h>

using namespace facebook;
using namespace jni;

using self = local_ref<HybridClass<vision::CameraView>::jhybriddata>;

self vision::CameraView::initHybrid(alias_ref<HybridClass::jhybridobject> jThis) {
  return makeCxxInstance(jThis);
}

void vision::CameraView::registerNatives() {
  registerHybrid({
    makeNativeMethod("initHybrid", CameraView::initHybrid),
    makeNativeMethod("frameProcessorCallback", CameraView::frameProcessorCallback),
  });
}

void vision::CameraView::frameProcessorCallback(int frame) {
  // TODO: frameProcessorCallback
}

void vision::CameraView::setFrameProcessor(const std::function<void(int)>& frameProcessor) {
  // TODO: setFrameProcessor
}

