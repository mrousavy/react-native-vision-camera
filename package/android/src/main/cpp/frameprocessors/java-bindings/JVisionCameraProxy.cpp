//
// Created by Marc Rousavy on 21.07.23.
//

#include "JVisionCameraProxy.h"

#include <memory>
#include <string>
#include <utility>

#include <jsi/jsi.h>

#include "FrameProcessorPluginHostObject.h"

#if VISION_CAMERA_ENABLE_FRAME_PROCESSORS
#include <react-native-worklets-core/WKTJsiWorklet.h>
#include <react-native-worklets-core/WKTJsiWorkletContext.h>
#endif

namespace vision {

using TSelf = local_ref<HybridClass<JVisionCameraProxy>::jhybriddata>;
using TJSCallInvokerHolder = jni::alias_ref<facebook::react::CallInvokerHolder::javaobject>;
using TScheduler = jni::alias_ref<JVisionCameraScheduler::javaobject>;
using TOptions = jni::local_ref<JMap<jstring, jobject>>;

JVisionCameraProxy::JVisionCameraProxy(const jni::alias_ref<JVisionCameraProxy::jhybridobject>& javaThis, jsi::Runtime* runtime,
                                       const std::shared_ptr<facebook::react::CallInvoker>& callInvoker,
                                       const jni::global_ref<JVisionCameraScheduler::javaobject>& scheduler) {
  _javaPart = make_global(javaThis);
  _runtime = runtime;

#if VISION_CAMERA_ENABLE_FRAME_PROCESSORS
  __android_log_write(ANDROID_LOG_INFO, TAG, "Creating Worklet Context...");

  auto runOnJS = [callInvoker](std::function<void()>&& f) {
    // Run on React JS Runtime
    callInvoker->invokeAsync(std::move(f));
  };
  auto runOnWorklet = [scheduler](std::function<void()>&& f) {
    // Run on Frame Processor Worklet Runtime
    scheduler->cthis()->dispatchAsync([f = std::move(f)]() { f(); });
  };
  _workletContext = std::make_shared<RNWorklet::JsiWorkletContext>("VisionCamera");
  _workletContext->initialize("VisionCamera", runtime, runOnJS, runOnWorklet);
  __android_log_write(ANDROID_LOG_INFO, TAG, "Worklet Context created!");
#else
  __android_log_write(ANDROID_LOG_INFO, TAG, "Frame Processors are disabled!");
#endif
}

JVisionCameraProxy::~JVisionCameraProxy() {
#if VISION_CAMERA_ENABLE_FRAME_PROCESSORS
  __android_log_write(ANDROID_LOG_INFO, TAG, "Destroying JVisionCameraProxy...");
#endif
}

void JVisionCameraProxy::setFrameProcessor(int viewTag, jsi::Runtime& runtime, const std::shared_ptr<jsi::Function>& function) {
#if VISION_CAMERA_ENABLE_FRAME_PROCESSORS
  auto worklet = std::make_shared<RNWorklet::JsiWorklet>(runtime, function);
  jni::local_ref<JFrameProcessor::javaobject> frameProcessor = JFrameProcessor::create(worklet, _workletContext);

  auto setFrameProcessorMethod = javaClassLocal()->getMethod<void(int, alias_ref<JFrameProcessor::javaobject>)>("setFrameProcessor");
  setFrameProcessorMethod(_javaPart, viewTag, frameProcessor);
#else
  throw std::runtime_error("system/frame-processors-unavailable: Frame Processors are disabled!");
#endif
}

void JVisionCameraProxy::removeFrameProcessor(int viewTag) {
  auto removeFrameProcessorMethod = javaClassLocal()->getMethod<void(int)>("removeFrameProcessor");
  removeFrameProcessorMethod(_javaPart, viewTag);
}

local_ref<JFrameProcessorPlugin::javaobject> JVisionCameraProxy::initFrameProcessorPlugin(const std::string& name, TOptions options) {
  auto initFrameProcessorPluginMethod =
      javaClassLocal()->getMethod<JFrameProcessorPlugin(local_ref<jstring>, TOptions)>("initFrameProcessorPlugin");
  return initFrameProcessorPluginMethod(_javaPart, make_jstring(name), std::move(options));
}

void JVisionCameraProxy::registerNatives() {
  registerHybrid({makeNativeMethod("initHybrid", JVisionCameraProxy::initHybrid)});
}

TSelf JVisionCameraProxy::initHybrid(alias_ref<jhybridobject> jThis, jlong jsRuntimePointer, TJSCallInvokerHolder jsCallInvokerHolder,
                                     const TScheduler& scheduler) {
  __android_log_write(ANDROID_LOG_INFO, TAG, "Initializing VisionCameraProxy...");

  // cast from JNI hybrid objects to C++ instances
  auto jsRuntime = reinterpret_cast<jsi::Runtime*>(jsRuntimePointer);
  auto jsCallInvoker = jsCallInvokerHolder->cthis()->getCallInvoker();
  auto sharedScheduler = make_global(scheduler);

  return makeCxxInstance(jThis, jsRuntime, jsCallInvoker, sharedScheduler);
}

} // namespace vision
