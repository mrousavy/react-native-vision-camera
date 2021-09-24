//
// Created by Marc Rousavy on 11.06.21.
//

#include "FrameProcessorRuntimeManager.h"
#include <android/log.h>
#include <jni.h>
#include <utility>
#include <string>

#include "RuntimeDecorator.h"
#include "RuntimeManager.h"
#include "reanimated-headers/AndroidScheduler.h"
#include "reanimated-headers/AndroidErrorHandler.h"

#include "MakeJSIRuntime.h"
#include "CameraView.h"
#include "java-bindings/JImageProxy.h"
#include "java-bindings/JImageProxyHostObject.h"
#include "JSIJNIConversion.h"
#include "VisionCameraScheduler.h"

namespace vision {

// type aliases
using TSelf = local_ref<HybridClass<vision::FrameProcessorRuntimeManager>::jhybriddata>;
using JSCallInvokerHolder = jni::alias_ref<facebook::react::CallInvokerHolder::javaobject>;
using AndroidScheduler = jni::alias_ref<VisionCameraScheduler::javaobject>;

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
    jlong jsContext,
    JSCallInvokerHolder jsCallInvokerHolder,
    AndroidScheduler androidScheduler) {
  __android_log_write(ANDROID_LOG_INFO, TAG,
                      "Initializing FrameProcessorRuntimeManager...");

  // cast from JNI hybrid objects to C++ instances
  auto jsCallInvoker = jsCallInvokerHolder->cthis()->getCallInvoker();
  auto scheduler = std::shared_ptr<VisionCameraScheduler>(androidScheduler->cthis());
  scheduler->setJSCallInvoker(jsCallInvoker);

  return makeCxxInstance(jThis, reinterpret_cast<jsi::Runtime *>(jsContext), jsCallInvoker, scheduler);
}

void vision::FrameProcessorRuntimeManager::initializeRuntime() {
  __android_log_write(ANDROID_LOG_INFO, TAG,
                      "Initializing Vision JS-Runtime...");

  // create JSI runtime and decorate it
  auto runtime = makeJSIRuntime();
  reanimated::RuntimeDecorator::decorateRuntime(*runtime, "FRAME_PROCESSOR");
  runtime->global().setProperty(*runtime, "_FRAME_PROCESSOR",
                                jsi::Value(true));

  // create REA runtime manager
  auto errorHandler = std::make_shared<reanimated::AndroidErrorHandler>(scheduler_);
  _runtimeManager = std::make_unique<reanimated::RuntimeManager>(std::move(runtime),
                                                                 errorHandler,
                                                                 scheduler_);

  __android_log_write(ANDROID_LOG_INFO, TAG,
                      "Initialized Vision JS-Runtime!");
}

CameraView* FrameProcessorRuntimeManager::findCameraViewById(int viewId) {
  static const auto func = javaPart_->getClass()->getMethod<CameraView*(jint)>("findCameraViewById");
  auto result = func(javaPart_.get(), viewId);
  return result->cthis();
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

// actual JSI installer
void FrameProcessorRuntimeManager::installJSIBindings() {
  __android_log_write(ANDROID_LOG_INFO, TAG, "Installing JSI bindings...");

  if (runtime_ == nullptr) {
    __android_log_write(ANDROID_LOG_ERROR, TAG,
                        "JS-Runtime was null, Frame Processor JSI bindings could not be installed!");
    return;
  }

  auto &jsiRuntime = *runtime_;

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
    if (!_runtimeManager || !_runtimeManager->runtime) {
      throw jsi::JSError(runtime,
                         "Camera::setFrameProcessor: The RuntimeManager is not yet initialized!");
    }

    // find camera view
    auto viewTag = arguments[0].asNumber();
    auto cameraView = findCameraViewById(static_cast<int>(viewTag));
    __android_log_write(ANDROID_LOG_INFO, TAG, "Found CameraView!");

    // TODO: does this have to be called on the separate VisionCamera Frame Processor Thread?

    // convert jsi::Function to a ShareableValue (can be shared across runtimes)
    __android_log_write(ANDROID_LOG_INFO, TAG, "Adapting Shareable value from function (conversion to worklet)...");
    auto worklet = reanimated::ShareableValue::adapt(runtime, arguments[1],
                                                     _runtimeManager.get());
    __android_log_write(ANDROID_LOG_INFO, TAG, "Successfully created worklet!");


    scheduler_->scheduleOnUI([=]() {
      // cast worklet to a jsi::Function for the new runtime
      auto &rt = *_runtimeManager->runtime;
      auto function = std::make_shared<jsi::Function>(worklet->getValue(rt).asObject(rt).asFunction(rt));

      // assign lambda to frame processor
      cameraView->setFrameProcessor([this, &rt, function](jni::alias_ref<JImageProxy::javaobject> frame) {
        try {
          // create HostObject which holds the Frame (JImageProxy)
          auto hostObject = std::make_shared<JImageProxyHostObject>(frame);
          function->callWithThis(rt, *function, jsi::Object::createFromHostObject(rt, hostObject));
        } catch (jsi::JSError& jsError) {
          auto message = "Frame Processor threw an error: " + jsError.getMessage();
          __android_log_write(ANDROID_LOG_ERROR, TAG, message.c_str());
          this->logErrorToJS(message);
        }
      });

      __android_log_write(ANDROID_LOG_INFO, TAG, "Frame Processor set!");
    });

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

    // find camera view
    auto viewTag = arguments[0].asNumber();
    auto cameraView = findCameraViewById(static_cast<int>(viewTag));

    // call Java method to unset frame processor
    cameraView->unsetFrameProcessor();

    __android_log_write(ANDROID_LOG_INFO, TAG, "Frame Processor removed!");

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

void FrameProcessorRuntimeManager::registerPlugin(alias_ref<FrameProcessorPlugin::javaobject> plugin) {
  // _runtimeManager might never be null, but we can never be too sure.
  if (!_runtimeManager || !_runtimeManager->runtime) {
    throw std::runtime_error("Tried to register plugin before initializing JS runtime! Call `initializeRuntime()` first.");
  }

  auto& runtime = *_runtimeManager->runtime;

  // we need a strong reference on the plugin, make_global does that.
  auto pluginGlobal = make_global(plugin);
  // name is always prefixed with two underscores (__)
  auto name = "__" + pluginGlobal->cthis()->getName();

  __android_log_print(ANDROID_LOG_INFO, TAG, "Installing Frame Processor Plugin \"%s\"...", name.c_str());

  auto callback = [pluginGlobal](jsi::Runtime& runtime,
                                 const jsi::Value& thisValue,
                                 const jsi::Value* arguments,
                                 size_t count) -> jsi::Value {
    // Unbox object and get typed HostObject
    auto boxedHostObject = arguments[0].asObject(runtime).asHostObject(runtime);
    auto frameHostObject = dynamic_cast<JImageProxyHostObject*>(boxedHostObject.get());

    // parse params - we are offset by `1` because the frame is the first parameter.
    auto params = JArrayClass<jobject>::newArray(count - 1);
    for (size_t i = 1; i < count; i++) {
      params->setElement(i - 1, JSIJNIConversion::convertJSIValueToJNIObject(runtime, arguments[i]));
    }

    // call implemented virtual method
    auto result = pluginGlobal->cthis()->callback(frameHostObject->frame, params);

    // convert result from JNI to JSI value
    return JSIJNIConversion::convertJNIObjectToJSIValue(runtime, result);
  };

  runtime.global().setProperty(runtime, name.c_str(), jsi::Function::createFromHostFunction(runtime,
                                                                                            jsi::PropNameID::forAscii(runtime, name),
                                                                                            1, // frame
                                                                                            callback));
}

} // namespace vision
