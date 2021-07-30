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
  // 1. add job to queue
  uiJobs.push(job);
  scheduleTrigger();
}

void VisionCameraScheduler::scheduleTrigger() {
  // 2. schedule `triggerUI` to be called on the java thread
  static auto method = javaPart_->getClass()->getMethod<void()>("scheduleTrigger");
  method(javaPart_.get());
}

void VisionCameraScheduler::triggerUI() {
  // 3. call job we enqueued in step 1.
  auto job = uiJobs.pop();
  job();
}

void VisionCameraScheduler::registerNatives() {
  registerHybrid({
    makeNativeMethod("initHybrid", VisionCameraScheduler::initHybrid),
    makeNativeMethod("triggerUI", VisionCameraScheduler::triggerUI),
  });
}

} // namespace vision