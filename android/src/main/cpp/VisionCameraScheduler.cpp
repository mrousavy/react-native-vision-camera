//
// Created by Marc Rousavy on 25.07.21.
//

#include "VisionCameraScheduler.h"
#include <fbjni/fbjni.h>
#include <fbjni/NativeRunnable.h>
#include <utility>

namespace vision {

using namespace facebook;

using TSelf = jni::local_ref<VisionCameraScheduler::jhybriddata>;

TSelf VisionCameraScheduler::initHybrid(jni::alias_ref<jhybridobject> jThis) {
  return makeCxxInstance(jThis);
}

void VisionCameraScheduler::scheduleOnUI(std::function<void()> job) {
  static const auto method = javaPart_->getClass()->getMethod<void(jni::JRunnable::javaobject)>("scheduleOnUI");
  auto jrunnable = jni::JNativeRunnable::newObjectCxxArgs(std::move(job));
  method(javaPart_.get(), jrunnable.get());
}

void VisionCameraScheduler::registerNatives() {
  registerHybrid({
    makeNativeMethod("initHybrid", VisionCameraScheduler::initHybrid),
  });
}

} // namespace vision
