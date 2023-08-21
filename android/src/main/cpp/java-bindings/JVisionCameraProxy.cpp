//
// Created by Marc Rousavy on 21.07.23.
//

#include "JVisionCameraProxy.h"

#include <memory>
#include <utility>
#include <string>

#include <jsi/jsi.h>
#include <react/jni/ReadableNativeMap.h>

#include <react-native-worklets-core/WKTJsiWorklet.h>
#include <react-native-worklets-core/WKTJsiWorkletContext.h>

#include "FrameProcessorPluginHostObject.h"

namespace vision {

using TSelf = local_ref<HybridClass<JVisionCameraProxy>::jhybriddata>;
using TJSCallInvokerHolder = jni::alias_ref<facebook::react::CallInvokerHolder::javaobject>;
using TScheduler = jni::alias_ref<JVisionCameraScheduler::javaobject>;
using TOptions = jni::local_ref<react::ReadableNativeMap::javaobject>;

JVisionCameraProxy::JVisionCameraProxy(const jni::alias_ref<JVisionCameraProxy::jhybridobject>& javaThis,
                                       jsi::Runtime* runtime,
                                       const std::shared_ptr<facebook::react::CallInvoker>& callInvoker,
                                       const jni::global_ref<JVisionCameraScheduler::javaobject>& scheduler) {
  _javaPart = make_global(javaThis);

  __android_log_write(ANDROID_LOG_INFO, TAG, "Creating Worklet Context...");

  auto runOnJS = [callInvoker](std::function<void()>&& f) {
    // Run on React JS Runtime
    callInvoker->invokeAsync(std::move(f));
  };
  auto runOnWorklet = [scheduler](std::function<void()>&& f) {
    // Run on Frame Processor Worklet Runtime
    scheduler->cthis()->dispatchAsync([f = std::move(f)](){
      f();
    });
  };
  _workletContext = std::make_shared<RNWorklet::JsiWorkletContext>("VisionCamera",
                                                                   runtime,
                                                                   runOnJS,
                                                                   runOnWorklet);
  __android_log_write(ANDROID_LOG_INFO, TAG, "Worklet Context created!");
}



void JVisionCameraProxy::setFrameProcessor(int viewTag,
                                           const alias_ref<JFrameProcessor::javaobject>& frameProcessor) {
  auto setFrameProcessorMethod = javaClassLocal()->getMethod<void(int, alias_ref<JFrameProcessor::javaobject>)>("setFrameProcessor");
  setFrameProcessorMethod(_javaPart, viewTag, frameProcessor);
}

void JVisionCameraProxy::removeFrameProcessor(int viewTag) {
  auto removeFrameProcessorMethod = javaClassLocal()->getMethod<void(int)>("removeFrameProcessor");
  removeFrameProcessorMethod(_javaPart, viewTag);
}

local_ref<JFrameProcessorPlugin::javaobject> JVisionCameraProxy::getFrameProcessorPlugin(const std::string& name,
                                                                                         TOptions options) {
  auto getFrameProcessorPluginMethod = javaClassLocal()->getMethod<JFrameProcessorPlugin(local_ref<jstring>, TOptions)>("getFrameProcessorPlugin");
  return getFrameProcessorPluginMethod(_javaPart, make_jstring(name), std::move(options));
}

void JVisionCameraProxy::registerNatives() {
  registerHybrid({
    makeNativeMethod("initHybrid", JVisionCameraProxy::initHybrid)
  });
}

TSelf JVisionCameraProxy::initHybrid(
    alias_ref<jhybridobject> jThis,
    jlong jsRuntimePointer,
    TJSCallInvokerHolder jsCallInvokerHolder,
    const TScheduler& scheduler) {
  __android_log_write(ANDROID_LOG_INFO, TAG, "Initializing VisionCameraProxy...");

  // cast from JNI hybrid objects to C++ instances
  auto jsRuntime = reinterpret_cast<jsi::Runtime*>(jsRuntimePointer);
  auto jsCallInvoker = jsCallInvokerHolder->cthis()->getCallInvoker();
  auto sharedScheduler = make_global(scheduler);

  return makeCxxInstance(jThis, jsRuntime, jsCallInvoker, sharedScheduler);
}

} // namespace vision
