//
// Created by Marc Rousavy on 25.07.21.
//

#include "JVisionCameraScheduler.h"
#include <fbjni/fbjni.h>

namespace vision {

using namespace facebook;
using TSelf = jni::local_ref<JVisionCameraScheduler::jhybriddata>;

TSelf JVisionCameraScheduler::initHybrid(jni::alias_ref<jhybridobject> jThis) {
  return makeCxxInstance(jThis);
}

void JVisionCameraScheduler::dispatchAsync(const std::function<void()>& job) {
  std::unique_lock<std::mutex> lock(_mutex);
  // 1. add job to queue
  _jobs.push(job);
  scheduleTrigger();
}

void JVisionCameraScheduler::scheduleTrigger() {
  // 2.1 Open a JNI Thread scope because this might be called from a C++ background Thread
  jni::ThreadScope::WithClassLoader([&]() {
    // 2.2 schedule `triggerUI` to be called on the java thread
    static auto method = _javaPart->getClass()->getMethod<void()>("scheduleTrigger");
    method(_javaPart.get());
  });
}

void JVisionCameraScheduler::trigger() {
  std::unique_lock<std::mutex> lock(_mutex);
  // 3. call job we enqueued in step 1.
  auto job = _jobs.front();
  job();
  _jobs.pop();
}

void JVisionCameraScheduler::registerNatives() {
  registerHybrid({
      makeNativeMethod("initHybrid", JVisionCameraScheduler::initHybrid),
      makeNativeMethod("trigger", JVisionCameraScheduler::trigger),
  });
}

} // namespace vision
