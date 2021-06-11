//
// Created by Marc Rousavy on 11.06.21.
//

#include "FrameProcessorRuntimeManager.h"
#include <android/log.h>

// type aliases
using self = local_ref<HybridClass<vision::FrameProcessorRuntimeManager>::jhybriddata>;
using JSCallInvokerHolder = jni::alias_ref<facebook::react::CallInvokerHolder::javaobject>;
using AndroidScheduler = jni::alias_ref<reanimated::AndroidScheduler::javaobject>;

// JNI binding
void vision::FrameProcessorRuntimeManager::registerNatives() {
  registerHybrid({
    makeNativeMethod("initHybrid", FrameProcessorRuntimeManager::initHybrid),
    makeNativeMethod("installJSIBindings", FrameProcessorRuntimeManager::installJSIBindings),
  });
}

// JNI init
self vision::FrameProcessorRuntimeManager::initHybrid(alias_ref<jhybridobject> jThis,
                                                      jlong jsContext,
                                                      JSCallInvokerHolder jsCallInvokerHolder,
                                                      AndroidScheduler androidScheduler) {
  __android_log_write(ANDROID_LOG_INFO, TAG, "initHybrid(...)");
  auto jsCallInvoker = jsCallInvokerHolder->cthis()->getCallInvoker();
  auto scheduler = androidScheduler->cthis()->getScheduler();
  scheduler->setJSCallInvoker(jsCallInvoker);

  return makeCxxInstance(jThis, (jsi::Runtime*)jsContext, jsCallInvoker, scheduler);
}

// actual JSI installer
void vision::FrameProcessorRuntimeManager::installJSIBindings() {
  __android_log_write(ANDROID_LOG_INFO, TAG, "installing JSI bindings...");
}
