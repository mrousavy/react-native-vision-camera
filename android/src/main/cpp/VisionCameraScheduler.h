//
// Created by Marc Rousavy on 25.07.21.
//

#pragma once

#include <jni.h>
#include <fbjni/fbjni.h>

namespace vision {

using namespace facebook;

class VisionCameraScheduler : public jni::HybridClass<VisionCameraScheduler> {
 public:
  static auto constexpr kJavaDescriptor = "Lcom/mrousavy/camera/frameprocessor/VisionCameraScheduler;";
  static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jhybridobject> jThis);
  static void registerNatives();

  // schedules the given job to be run on the VisionCamera FP Thread at some future point in time
  void scheduleOnUI(std::function<void()> job);

 private:
  friend HybridBase;
  jni::global_ref<VisionCameraScheduler::javaobject> javaPart_;

  explicit VisionCameraScheduler(jni::alias_ref<VisionCameraScheduler::jhybridobject> jThis):
    javaPart_(jni::make_global(jThis)) {}
};

} // namespace vision
