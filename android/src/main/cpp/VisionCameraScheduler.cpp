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

void VisionCameraScheduler::dispatchAsync(std::function<void()> job) {
  // 1. add job to queue
  _jobs.push(job);
  scheduleTrigger();
}

void VisionCameraScheduler::scheduleTrigger() {
  // 2. schedule `triggerUI` to be called on the java thread
  static auto method = javaPart_->getClass()->getMethod<void()>("scheduleTrigger");
  method(javaPart_.get());
}

void VisionCameraScheduler::trigger() {
  std::unique_lock<std::mutex> lock(_mutex);
  // 3. call job we enqueued in step 1.
  auto job = _jobs.front();
  job();
  _jobs.pop();
}

void VisionCameraScheduler::registerNatives() {
  registerHybrid({
    makeNativeMethod("initHybrid", VisionCameraScheduler::initHybrid),
    makeNativeMethod("trigger", VisionCameraScheduler::trigger),
  });
}

} // namespace vision