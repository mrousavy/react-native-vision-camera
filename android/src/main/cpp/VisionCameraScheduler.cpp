//
// Created by Marc Rousavy on 25.07.21.
//

#include "VisionCameraScheduler.h"
#include <fbjni/fbjni.h>

namespace vision {

using namespace facebook;
using TSelf = jni::local_ref<VisionCameraScheduler::jhybriddata>;

TSelf VisionCameraScheduler::initHybrid(jni::alias_ref<jhybridobject> jThis) {
  return makeCxxInstance(jThis);
}

void VisionCameraScheduler::scheduleOnUI(std::function<void()> job) {
  job_ = std::move(job);
  scheduleTrigger();
}

void VisionCameraScheduler::scheduleTrigger() {
  static auto method = javaPart_->getClass()->getMethod<void()>("scheduleTrigger");
  method(javaPart_.get());
}

void VisionCameraScheduler::triggerUI() {
  auto job = std::move(job_);
  job();
}

void VisionCameraScheduler::registerNatives() {
  registerHybrid({
    makeNativeMethod("initHybrid", VisionCameraScheduler::initHybrid),
    makeNativeMethod("triggerUI", VisionCameraScheduler::triggerUI),
  });
}

} // namespace vision