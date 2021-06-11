//
// Created by Marc Rousavy on 11.06.21.
//

#include "CameraViewModule.h"

void vision::CameraViewModule::registerNatives() {
  registerHybrid({
    makeNativeMethod("initHybrid", CameraViewModule::initHybrid),
    makeNativeMethod("installJSIBindings", CameraViewModule::installJSIBindings),
  });
}

void vision::CameraViewModule::installJSIBindings() {

}

local_ref<HybridClass<vision::CameraViewModule>::jhybriddata>
vision::CameraViewModule::initHybrid(alias_ref<jhybridobject> jThis,
                                     jlong jsContext,
                                     jni::alias_ref<facebook::react::CallInvokerHolder::javaobject> jsCallInvokerHolder,
                                     jni::alias_ref<reanimated::AndroidScheduler::javaobject> androidScheduler) {
  auto jsCallInvoker = jsCallInvokerHolder->cthis()->getCallInvoker();
  auto scheduler = androidScheduler->cthis()->getScheduler();
  scheduler->setJSCallInvoker(jsCallInvoker);

  return makeCxxInstance(jThis, (jsi::Runtime*)jsContext, jsCallInvoker, scheduler);
}
