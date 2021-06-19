//
// Created by Marc Rousavy on 14.06.21.
//

#include "CameraView.h"
#include <memory>
#include <fbjni/fbjni.h>

using namespace facebook;
using namespace jni;

namespace vision {

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

void CameraView::frameProcessorCallback(int frame) {
  // TODO: frameProcessorCallback
}

void CameraView::setFrameProcessor(FrameProcessor&& frameProcessor) {
  frameProcessor_ = frameProcessor;
  // TODO: setFrameProcessor
}

void vision::CameraView::unsetFrameProcessor() {

}

} // namespace vision
