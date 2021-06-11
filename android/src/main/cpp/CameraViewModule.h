//
// Created by Marc Rousavy on 11.06.21.
//

#pragma once

#include <fbjni/fbjni.h>
#include <jsi/jsi.h>
#include <ReactCommon/CallInvokerHolder.h>
#include <memory>

#include "Scheduler.h"
#include "RuntimeManager.h"
#include "AndroidScheduler.h"

namespace vision {

using namespace facebook;

class CameraViewModule : public jni::HybridClass<CameraViewModule> {
public:
  static auto constexpr kJavaDescriptor =
      "Lcom/mrousavy/camera/CameraViewModule;";
  static jni::local_ref<jhybriddata> initHybrid(
      jni::alias_ref<jhybridobject> jThis,
      jlong jsContext,
      jni::alias_ref<facebook::react::CallInvokerHolder::javaobject> jsCallInvokerHolder,
      jni::alias_ref<reanimated::AndroidScheduler::javaobject> androidScheduler);
  static void registerNatives();

private:
  friend HybridBase;
  jni::global_ref<CameraViewModule::javaobject> javaPart_;
  jsi::Runtime* runtime_;
  std::shared_ptr<facebook::react::CallInvoker> jsCallInvoker_;
  std::shared_ptr<reanimated::RuntimeManager> _runtimeManager;
  std::shared_ptr<reanimated::Scheduler> scheduler_;

  void installJSIBindings();


  explicit CameraViewModule(
    jni::alias_ref<CameraViewModule::jhybridobject> jThis,
    jsi::Runtime* runtime,
    std::shared_ptr<facebook::react::CallInvoker> jsCallInvoker,
    std::shared_ptr<reanimated::Scheduler> scheduler) :
      javaPart_(jni::make_global(jThis)),
      runtime_(runtime),
      jsCallInvoker_(jsCallInvoker),
      scheduler_(scheduler)
  {}
};

} // namespace vision
