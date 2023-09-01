//
// Created by Marc Rousavy on 11.06.21.
//

#include "FrameProcessorRuntimeManager.h"
#include <android/log.h>
#include <jni.h>
#include <utility>
#include <string>

#include "CameraView.h"
#include "FrameHostObject.h"
#include "JSIJNIConversion.h"
#include "VisionCameraScheduler.h"
#include "java-bindings/JImageProxy.h"
#include "java-bindings/JFrameProcessorPlugin.h"

namespace vision {

// type aliases
using TSelf = local_ref<HybridClass<vision::FrameProcessorRuntimeManager>::jhybriddata>;
using TJSCallInvokerHolder = jni::alias_ref<facebook::react::CallInvokerHolder::javaobject>;
using TAndroidScheduler = jni::alias_ref<VisionCameraScheduler::javaobject>;

// JNI binding
void vision::FrameProcessorRuntimeManager::registerNatives() {
  registerHybrid({
    makeNativeMethod("initHybrid",
                     FrameProcessorRuntimeManager::initHybrid),
    makeNativeMethod("installJSIBindings",
                     FrameProcessorRuntimeManager::installJSIBindings),
    makeNativeMethod("initializeRuntime",
                     FrameProcessorRuntimeManager::initializeRuntime),
    makeNativeMethod("registerPlugin",
                     FrameProcessorRuntimeManager::registerPlugin),
  });
}

// JNI init
TSelf vision::FrameProcessorRuntimeManager::initHybrid(
    alias_ref<jhybridobject> jThis,
    jlong jsRuntimePointer,
    TJSCallInvokerHolder jsCallInvokerHolder,
    TAndroidScheduler androidScheduler) {
  __android_log_write(ANDROID_LOG_INFO, TAG,
                      "Initializing FrameProcessorRuntimeManager...");

  // cast from JNI hybrid objects to C++ instances
  auto runtime = reinterpret_cast<jsi::Runtime*>(jsRuntimePointer);
  auto jsCallInvoker = jsCallInvokerHolder->cthis()->getCallInvoker();
  auto scheduler = std::shared_ptr<VisionCameraScheduler>(androidScheduler->cthis());

  return makeCxxInstance(jThis, runtime, jsCallInvoker, scheduler);
}

void vision::FrameProcessorRuntimeManager::initializeRuntime() {
  __android_log_write(ANDROID_LOG_INFO, TAG,
                      "Initializing Vision JS-Runtime...");

  // create JSI runtime and decorate it

  // create REA runtime manager

  __android_log_write(ANDROID_LOG_INFO, TAG,
                      "Initialized Vision JS-Runtime!");
}

global_ref<CameraView::javaobject> FrameProcessorRuntimeManager::findCameraViewById(int viewId) {
  static const auto findCameraViewByIdMethod = javaPart_->getClass()->getMethod<CameraView(jint)>("findCameraViewById");
  auto weakCameraView = findCameraViewByIdMethod(javaPart_.get(), viewId);
  return make_global(weakCameraView);
}

void FrameProcessorRuntimeManager::registerPlugins() {
  static const auto registerPluginsMethod = javaPart_->getClass()->getMethod<void()>("registerPlugins");
  registerPluginsMethod(javaPart_.get());
}

void FrameProcessorRuntimeManager::logErrorToJS(const std::string& message) {
  if (!this->jsCallInvoker_) {
    return;
  }

  this->jsCallInvoker_->invokeAsync([this, message]() {
    if (this->runtime_ == nullptr) {
      return;
    }

    auto& runtime = *this->runtime_;
    auto consoleError = runtime
        .global()
        .getPropertyAsObject(runtime, "console")
        .getPropertyAsFunction(runtime, "error");
    consoleError.call(runtime, jsi::String::createFromUtf8(runtime, message));
  });
}

void FrameProcessorRuntimeManager::setFrameProcessor(jsi::Runtime& rnRuntime,
                                                     int viewTag,
                                                     const jsi::Value& frameProcessor,
                                                     const jsi::Value& workletRuntimeValue) {
  __android_log_write(ANDROID_LOG_INFO, TAG,
                      "Setting new Frame Processor...");

  workletRuntime_ = reanimated::extractWorkletRuntime(rnRuntime, workletRuntimeValue);
  jsi::Runtime &visionRuntime = workletRuntime_->getJSIRuntime();
  visionRuntime.global().setProperty(visionRuntime, "_FRAME_PROCESSOR", jsi::Value(true));

  registerPlugins();

  // find camera view
  auto cameraView = findCameraViewById(viewTag);
  __android_log_write(ANDROID_LOG_INFO, TAG, "Found CameraView!");

  // convert jsi::Function to a ShareableValue (can be shared across runtimes)
  __android_log_write(ANDROID_LOG_INFO, TAG,
                      "Adapting Shareable value from function (conversion to worklet)...");
  auto shareableWorklet = reanimated::extractShareableOrThrow<reanimated::ShareableWorklet>(rnRuntime, frameProcessor);
  __android_log_write(ANDROID_LOG_INFO, TAG, "Successfully created worklet!");

  scheduler_->scheduleOnUI([=]() {
      // cast worklet to a jsi::Function for the new runtime
      // assign lambda to frame processor
      cameraView->cthis()->setFrameProcessor([=](jni::alias_ref<JImageProxy::javaobject> frame) {
          // create HostObject which holds the Frame (JImageProxy)
          auto frameHostObject = std::make_shared<FrameHostObject>(frame);
          jsi::Runtime &runtime = workletRuntime_->getJSIRuntime();
          auto hostObject = jsi::Object::createFromHostObject(runtime, frameHostObject);
          workletRuntime_->runGuarded(shareableWorklet, hostObject);
      });

      __android_log_write(ANDROID_LOG_INFO, TAG, "Frame Processor set!");
  });
}

void FrameProcessorRuntimeManager::unsetFrameProcessor(int viewTag) {
  __android_log_write(ANDROID_LOG_INFO, TAG, "Removing Frame Processor...");

  // find camera view
  auto cameraView = findCameraViewById(viewTag);

  // call Java method to unset frame processor
  cameraView->cthis()->unsetFrameProcessor();

  __android_log_write(ANDROID_LOG_INFO, TAG, "Frame Processor removed!");
}

// actual JSI installer
void FrameProcessorRuntimeManager::installJSIBindings() {
  __android_log_write(ANDROID_LOG_INFO, TAG, "Installing JSI bindings...");

  if (runtime_ == nullptr) {
    __android_log_write(ANDROID_LOG_ERROR, TAG,
                        "JS-Runtime was null, Frame Processor JSI bindings could not be installed!");
    return;
  }

  auto& jsiRuntime = *runtime_;

  auto setFrameProcessor = [this](jsi::Runtime &runtime,
                                  const jsi::Value &thisValue,
                                  const jsi::Value *arguments,
                                  size_t count) -> jsi::Value {
    __android_log_write(ANDROID_LOG_INFO, TAG,
                        "Setting new Frame Processor...");

    if (!arguments[0].isNumber()) {
      throw jsi::JSError(runtime,
                         "Camera::setFrameProcessor: First argument ('viewTag') must be a number!");
    }
    if (!arguments[1].isObject()) {
      throw jsi::JSError(runtime,
                         "Camera::setFrameProcessor: Second argument ('frameProcessor') must be a function!");
    }
    if (!arguments[2].isObject()) {
      throw jsi::JSError(runtime,
                         "Camera::setFrameProcessor: Third argument ('workletRuntime') must be an object!");
    }

    double viewTag = arguments[0].asNumber();
    const jsi::Value& frameProcessor = arguments[1];
    const jsi::Value& workletRuntimeValue = arguments[2];
    this->setFrameProcessor(runtime, static_cast<int>(viewTag), frameProcessor, workletRuntimeValue);

    return jsi::Value::undefined();
  };
  jsiRuntime.global().setProperty(jsiRuntime,
                                  "setFrameProcessor",
                                  jsi::Function::createFromHostFunction(
                                      jsiRuntime,
                                      jsi::PropNameID::forAscii(jsiRuntime,
                                                                "setFrameProcessor"),
                                      2,  // viewTag, frameProcessor
                                      setFrameProcessor));


  auto unsetFrameProcessor = [this](jsi::Runtime &runtime,
                                    const jsi::Value &thisValue,
                                    const jsi::Value *arguments,
                                    size_t count) -> jsi::Value {
    __android_log_write(ANDROID_LOG_INFO, TAG, "Removing Frame Processor...");
    if (!arguments[0].isNumber()) {
      throw jsi::JSError(runtime,
                         "Camera::unsetFrameProcessor: First argument ('viewTag') must be a number!");
    }

    auto viewTag = arguments[0].asNumber();
    this->unsetFrameProcessor(static_cast<int>(viewTag));

    return jsi::Value::undefined();
  };
  jsiRuntime.global().setProperty(jsiRuntime,
                                  "unsetFrameProcessor",
                                  jsi::Function::createFromHostFunction(
                                      jsiRuntime,
                                      jsi::PropNameID::forAscii(jsiRuntime,
                                                                "unsetFrameProcessor"),
                                      1, // viewTag
                                      unsetFrameProcessor));

  __android_log_write(ANDROID_LOG_INFO, TAG, "Finished installing JSI bindings!");
}

void FrameProcessorRuntimeManager::registerPlugin(alias_ref<JFrameProcessorPlugin::javaobject> plugin) {
  // _runtimeManager might never be null, but we can never be too sure.
  if (!workletRuntime_) {
    throw std::runtime_error("Tried to register plugin before initializing JS runtime! Call `initializeRuntime()` first.");
  }

  auto& runtime = workletRuntime_->getJSIRuntime();

  // we need a strong reference on the plugin, make_global does that.
  auto pluginGlobal = make_global(plugin);
  // name is always prefixed with two underscores (__)
  auto name = "__" + pluginGlobal->getName();

  __android_log_print(ANDROID_LOG_INFO, TAG, "Installing Frame Processor Plugin \"%s\"...", name.c_str());

  auto callback = [pluginGlobal](jsi::Runtime& runtime,
                                 const jsi::Value& thisValue,
                                 const jsi::Value* arguments,
                                 size_t count) -> jsi::Value {
    // Unbox object and get typed HostObject
    auto boxedHostObject = arguments[0].asObject(runtime).asHostObject(runtime);
    auto frameHostObject = static_cast<FrameHostObject*>(boxedHostObject.get());

    // parse params - we are offset by `1` because the frame is the first parameter.
    auto params = JArrayClass<jobject>::newArray(count - 1);
    for (size_t i = 1; i < count; i++) {
      params->setElement(i - 1, JSIJNIConversion::convertJSIValueToJNIObject(runtime, arguments[i]));
    }

    // call implemented virtual method
    auto result = pluginGlobal->callback(frameHostObject->frame, params);

    // convert result from JNI to JSI value
    return JSIJNIConversion::convertJNIObjectToJSIValue(runtime, result);
  };

  runtime.global().setProperty(runtime, name.c_str(), jsi::Function::createFromHostFunction(runtime,
                                                                                            jsi::PropNameID::forAscii(runtime, name),
                                                                                            1, // frame
                                                                                            callback));
}

} // namespace vision
