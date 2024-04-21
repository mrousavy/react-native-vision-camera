//
// Created by Marc Rousavy on 25.07.21.
//

#pragma once

#include <fbjni/fbjni.h>
#include <jni.h>
#include <mutex>
#include <queue>

namespace vision {

using namespace facebook;

/**
 * A Scheduler that runs methods on the Frame Processor Thread (which is a Java Thread).
 * In order to call something on the Java Frame Processor Thread, you have to:
 *
 * 1. Call `dispatchAsync(..)` with the given C++ Method.
 * 2. Internally, `scheduleTrigger()` will get called, which is a Java Method.
 * 3. The `scheduleTrigger()` Java Method will switch to the Frame Processor Java Thread and call
 * `trigger()` on there
 * 4. `trigger()` is a C++ function here that just calls the passed C++ Method from step 1.
 */
class JVisionCameraScheduler : public jni::HybridClass<JVisionCameraScheduler> {
public:
  static auto constexpr kJavaDescriptor = "Lcom/mrousavy/camera/frameprocessors/VisionCameraScheduler;";
  static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jhybridobject> jThis);
  static void registerNatives();

  // schedules the given job to be run on the VisionCamera FP Thread at some future point in time
  void dispatchAsync(const std::function<void()>& job);

private:
  friend HybridBase;
  jni::global_ref<JVisionCameraScheduler::javaobject> _javaPart;
  std::queue<std::function<void()>> _jobs;
  std::mutex _mutex;

  explicit JVisionCameraScheduler(jni::alias_ref<JVisionCameraScheduler::jhybridobject> jThis) : _javaPart(jni::make_global(jThis)) {}

  // Schedules a call to `trigger` on the VisionCamera FP Thread
  void scheduleTrigger();
  // Calls the latest job in the job queue
  void trigger();
};

} // namespace vision
