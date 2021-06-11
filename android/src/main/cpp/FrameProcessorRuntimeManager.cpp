//
// Created by Marc Rousavy on 11.06.21.
//

#include "FrameProcessorRuntimeManager.h"
#include <android/log.h>

#include "RuntimeDecorator.h"
#include "AndroidErrorHandler.h"

#include "MakeJSIRuntime.h"

// type aliases
using self = local_ref<HybridClass<vision::FrameProcessorRuntimeManager>::jhybriddata>;
using JSCallInvokerHolder = jni::alias_ref<facebook::react::CallInvokerHolder::javaobject>;
using AndroidScheduler = jni::alias_ref<reanimated::AndroidScheduler::javaobject>;

// JNI binding
void vision::FrameProcessorRuntimeManager::registerNatives() {
  registerHybrid({
    makeNativeMethod("initHybrid", FrameProcessorRuntimeManager::initHybrid),
    makeNativeMethod("installJSIBindings", FrameProcessorRuntimeManager::installJSIBindings),
    makeNativeMethod("initializeRuntime", FrameProcessorRuntimeManager::initializeRuntime),
  });
}

// JNI init
self vision::FrameProcessorRuntimeManager::initHybrid(alias_ref<jhybridobject> jThis,
                                                      jlong jsContext,
                                                      JSCallInvokerHolder jsCallInvokerHolder,
                                                      AndroidScheduler androidScheduler) {
  __android_log_write(ANDROID_LOG_INFO, TAG, "Initializing FrameProcessorRuntimeManager...");
  auto jsCallInvoker = jsCallInvokerHolder->cthis()->getCallInvoker();
  auto scheduler = androidScheduler->cthis()->getScheduler();
  scheduler->setJSCallInvoker(jsCallInvoker);

  return makeCxxInstance(jThis, (jsi::Runtime*)jsContext, jsCallInvoker, scheduler);
}

void vision::FrameProcessorRuntimeManager::initializeRuntime() {
  __android_log_write(ANDROID_LOG_INFO, TAG, "Initializing Vision JS-Runtime...");

  auto runtime = makeJSIRuntime();
  reanimated::RuntimeDecorator::decorateRuntime(*runtime, "FRAME_PROCESSOR");
  runtime->global().setProperty(*runtime, "_FRAME_PROCESSOR", jsi::Value(true));

  auto errorHandler = std::make_shared<reanimated::AndroidErrorHandler>(scheduler_);
  _runtimeManager = std::make_unique<reanimated::RuntimeManager>(std::move(runtime),
                                                                 errorHandler,
                                                                 scheduler_);

  auto& visionRuntime = *_runtimeManager->runtime;
  auto visionGlobal = visionRuntime.global();

  // TODO: Initialize plugins here.

  __android_log_write(ANDROID_LOG_INFO, TAG, "Initialized Vision JS-Runtime!");
}

// actual JSI installer
void vision::FrameProcessorRuntimeManager::installJSIBindings() {
  __android_log_write(ANDROID_LOG_INFO, TAG, "installing JSI bindings...");

  if (runtime_ == nullptr) {
    __android_log_write(ANDROID_LOG_ERROR, TAG, "JS-Runtime was null, Frame Processor JSI bindings could not be installed!");
    return;
  }

  auto& jsiRuntime = *runtime_;

  auto setFrameProcessor = [this](jsi::Runtime& runtime,
                                  const jsi::Value& thisValue,
                                  const jsi::Value* arguments,
                                  size_t count) -> jsi::Value {
    __android_log_write(ANDROID_LOG_INFO, TAG, "Setting new Frame Processor...");
    if (!arguments[0].isNumber()) throw jsi::JSError(runtime, "Camera::setFrameProcessor: First argument ('viewTag') must be a number!");
    if (!arguments[1].isObject()) throw jsi::JSError(runtime, "Camera::setFrameProcessor: Second argument ('frameProcessor') must be a function!");
    if (!_runtimeManager || !_runtimeManager->runtime) throw jsi::JSError(runtime, "Camera::setFrameProcessor: The RuntimeManager is not yet initialized!");

    auto viewTag = arguments[0].asNumber();
    __android_log_write(ANDROID_LOG_INFO, TAG, "Adapting Shareable value from function (conversion to worklet)...");
    auto worklet = reanimated::ShareableValue::adapt(runtime, arguments[1], _runtimeManager.get());
    __android_log_write(ANDROID_LOG_INFO, TAG, "Successfully created worklet!");

    // TODO: Find CameraView by it's viewTag
    // TODO: Set [worklet] to CameraView and notify it

    __android_log_write(ANDROID_LOG_INFO, TAG, "Frame Processor set!");

    return jsi::Value::undefined();
  };
  jsiRuntime.global().setProperty(jsiRuntime,
                                  "setFrameProcessor",
                                  jsi::Function::createFromHostFunction(jsiRuntime,
                                                                        jsi::PropNameID::forAscii(jsiRuntime, "setFrameProcessor"),
                                                                        2,  // viewTag, frameProcessor
                                                                     setFrameProcessor));


  auto unsetFrameProcessor = [this](jsi::Runtime& runtime,
                                    const jsi::Value& thisValue,
                                    const jsi::Value* arguments,
                                    size_t count) -> jsi::Value {
    __android_log_write(ANDROID_LOG_INFO, TAG, "Removing Frame Processor...");
    if (!arguments[0].isNumber()) throw jsi::JSError(runtime, "Camera::unsetFrameProcessor: First argument ('viewTag') must be a number!");

    auto viewTag = arguments[0].asNumber();

    // TODO: Find CameraView by it's viewTag
    // TODO: Remove CameraView's [frameProcessor] (worklet) property and notify it

    __android_log_write(ANDROID_LOG_INFO, TAG, "Frame Processor removed!");
    return jsi::Value::undefined();
  };
  jsiRuntime.global().setProperty(jsiRuntime,
                                  "unsetFrameProcessor",
                                  jsi::Function::createFromHostFunction(jsiRuntime,
                                                                        jsi::PropNameID::forAscii(jsiRuntime, "unsetFrameProcessor"),
                                                                        1, // viewTag
                                                                     unsetFrameProcessor));

  __android_log_write(ANDROID_LOG_INFO, TAG, "Finished installing JSI bindings!");
}
