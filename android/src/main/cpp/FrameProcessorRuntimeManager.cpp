//
// Created by Marc Rousavy on 11.06.21.
//

#include "FrameProcessorRuntimeManager.h"

void vision::FrameProcessorRuntimeManager::registerNatives() {
  registerHybrid({
    makeNativeMethod("initHybrid", FrameProcessorRuntimeManager::initHybrid),
    makeNativeMethod("installJSIBindings", FrameProcessorRuntimeManager::installJSIBindings),
  });
}

void vision::FrameProcessorRuntimeManager::installJSIBindings() {

}

local_ref<HybridClass<vision::FrameProcessorRuntimeManager>::jhybriddata>
vision::FrameProcessorRuntimeManager::initHybrid(alias_ref<jhybridobject> jThis,
                                                 jlong jsContext,
                                                 jni::alias_ref<facebook::react::CallInvokerHolder::javaobject> jsCallInvokerHolder,
                                                 jni::alias_ref<reanimated::AndroidScheduler::javaobject> androidScheduler) {
  auto jsCallInvoker = jsCallInvokerHolder->cthis()->getCallInvoker();
  auto scheduler = androidScheduler->cthis()->getScheduler();
  scheduler->setJSCallInvoker(jsCallInvoker);

  return makeCxxInstance(jThis, (jsi::Runtime*)jsContext, jsCallInvoker, scheduler);
}
