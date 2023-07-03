//
// Created by Marc Rousavy on 11.06.21.
//

#include "FrameProcessorRuntimeManager.h"
#include <android/log.h>
#include <jni.h>
#include <utility>
#include <string>
#include <react-native-worklets/WKTJsiWorklet.h>
#include <react-native-worklets/WKTJsiHostObject.h>

#include "CameraView.h"
#include "FrameHostObject.h"
#include "JSIJNIConversion.h"
#include "java-bindings/JImageProxy.h"
#include "java-bindings/JFrameProcessorPlugin.h"
#include "JSITypedArray.h"

namespace vision {

// type aliases
using TSelf = local_ref<HybridClass<vision::FrameProcessorRuntimeManager>::jhybriddata>;
using TJSCallInvokerHolder = jni::alias_ref<facebook::react::CallInvokerHolder::javaobject>;
using TAndroidScheduler = jni::alias_ref<VisionCameraScheduler::javaobject>;

FrameProcessorRuntimeManager::FrameProcessorRuntimeManager(jni::alias_ref<FrameProcessorRuntimeManager::jhybridobject> jThis,
                                                                    jsi::Runtime* jsRuntime,
                                                                    std::shared_ptr<facebook::react::CallInvoker> jsCallInvoker,
                                                                    std::shared_ptr<vision::VisionCameraScheduler> scheduler) :
                                                                    javaPart_(jni::make_global(jThis)),
                                                                    _jsRuntime(jsRuntime) {
    auto runOnJS = [jsCallInvoker](std::function<void()>&& f) {
        // Run on React JS Runtime
        jsCallInvoker->invokeAsync(std::move(f));
    };
    auto runOnWorklet = [scheduler](std::function<void()>&& f) {
        // Run on Frame Processor Worklet Runtime
        scheduler->dispatchAsync(std::move(f));
    };
    _workletContext = std::make_shared<RNWorklet::JsiWorkletContext>("VisionCamera",
                                                                    jsRuntime,
                                                                    runOnJS,
                                                                    runOnWorklet);
}

// JNI binding
void vision::FrameProcessorRuntimeManager::registerNatives() {
  registerHybrid({
    makeNativeMethod("initHybrid",
                     FrameProcessorRuntimeManager::initHybrid),
    makeNativeMethod("installJSIBindings",
                     FrameProcessorRuntimeManager::installJSIBindings),
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
  auto jsRuntime = reinterpret_cast<jsi::Runtime*>(jsRuntimePointer);
  auto jsCallInvoker = jsCallInvokerHolder->cthis()->getCallInvoker();
  auto scheduler = std::shared_ptr<VisionCameraScheduler>(androidScheduler->cthis());

  return makeCxxInstance(jThis, jsRuntime, jsCallInvoker, scheduler);
}

global_ref<CameraView::javaobject> FrameProcessorRuntimeManager::findCameraViewById(int viewId) {
  static const auto findCameraViewByIdMethod = javaPart_->getClass()->getMethod<CameraView(jint)>("findCameraViewById");
  auto weakCameraView = findCameraViewByIdMethod(javaPart_.get(), viewId);
  return make_global(weakCameraView);
}

void FrameProcessorRuntimeManager::logErrorToJS(const std::string& message) {
  if (!_workletContext) {
    return;
  }
  // Call console.error() on JS Thread
  _workletContext->invokeOnJsThread([message](jsi::Runtime& runtime) {
      auto consoleError = runtime
              .global()
              .getPropertyAsObject(runtime, "console")
              .getPropertyAsFunction(runtime, "error");
      consoleError.call(runtime, jsi::String::createFromUtf8(runtime, message));
  });
}

void FrameProcessorRuntimeManager::setFrameProcessor(jsi::Runtime& runtime,
                                                     int viewTag,
                                                     const jsi::Value& frameProcessor) {
  __android_log_write(ANDROID_LOG_INFO, TAG, "Setting new Frame Processor...");

  if (!_workletContext) {
    throw jsi::JSError(runtime,
                       "setFrameProcessor(..): VisionCamera's Worklet Context is not yet initialized!");
  }

  // find camera view
  auto cameraView = findCameraViewById(viewTag);

  // convert jsi::Function to a Worklet (can be shared across runtimes)
  auto worklet = std::make_shared<RNWorklet::JsiWorklet>(runtime, frameProcessor);
  auto workletInvoker = std::make_shared<RNWorklet::WorkletInvoker>(worklet);

  _workletContext->invokeOnWorkletThread([=](RNWorklet::JsiWorkletContext*, jsi::Runtime& rt) {
    // Set Frame Processor as callable C++ lambda - this will then call the Worklet
    cameraView->cthis()->setFrameProcessor([this, workletInvoker, &rt](jni::alias_ref<JImageProxy::javaobject> frame) {
      try {
        // create HostObject which holds the Frame (JImageProxy)
        auto frameHostObject = std::make_shared<FrameHostObject>(frame);
        auto argument = jsi::Object::createFromHostObject(rt, frameHostObject);
        jsi::Value jsValue(std::move(argument));
        // Call the Worklet on the Worklet Runtime
        workletInvoker->call(rt, jsi::Value::undefined(), &jsValue, 1);
      } catch (jsi::JSError& jsError) {
        // Worklet threw a JS Error, catch it and log it to JS.
        auto message = "Frame Processor threw an error: " + jsError.getMessage();
        __android_log_write(ANDROID_LOG_ERROR, TAG, message.c_str());
        this->logErrorToJS(message);
      }
    });
  });
}

void FrameProcessorRuntimeManager::unsetFrameProcessor(int viewTag) {
  __android_log_write(ANDROID_LOG_INFO, TAG, "Removing Frame Processor...");

  // find camera view
  auto cameraView = findCameraViewById(viewTag);

  // call Java method to unset frame processor
  cameraView->cthis()->unsetFrameProcessor();
}

// actual JSI installer
void FrameProcessorRuntimeManager::installJSIBindings() {
  __android_log_write(ANDROID_LOG_INFO, TAG, "Installing JSI bindings...");

  if (_jsRuntime == nullptr) {
    __android_log_write(ANDROID_LOG_ERROR, TAG,
                        "JS-Runtime was null, Frame Processor JSI bindings could not be installed!");
    return;
  }

  auto& jsiRuntime = *_jsRuntime;

  // HostObject that attaches the cache to the lifecycle of the Runtime. On Runtime destroy, we destroy the cache.
  auto propNameCacheObject = std::make_shared<vision::InvalidateCacheOnDestroy>(jsiRuntime);
  jsiRuntime.global().setProperty(jsiRuntime,
                                  "__visionCameraPropNameCache",
                                  jsi::Object::createFromHostObject(jsiRuntime, propNameCacheObject));

  auto setFrameProcessor = JSI_HOST_FUNCTION_LAMBDA {
    __android_log_write(ANDROID_LOG_INFO, TAG, "Setting new Frame Processor...");

    double viewTag = arguments[0].asNumber();
    const jsi::Value& frameProcessor = arguments[1];
    this->setFrameProcessor(runtime, static_cast<int>(viewTag), frameProcessor);

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


  auto unsetFrameProcessor = JSI_HOST_FUNCTION_LAMBDA {
    __android_log_write(ANDROID_LOG_INFO, TAG, "Removing Frame Processor...");

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
  auto& runtime = *_jsRuntime;

  // we need a strong reference on the plugin, make_global does that.
  auto pluginGlobal = make_global(plugin);
  auto pluginName = pluginGlobal->getName();

  __android_log_print(ANDROID_LOG_INFO, TAG, "Installing Frame Processor Plugin \"%s\"...", pluginName.c_str());

  if (!runtime.global().hasProperty(runtime, "FrameProcessorPlugins")) {
      runtime.global().setProperty(runtime, "FrameProcessorPlugins", jsi::Object(runtime));
  }
  jsi::Object frameProcessorPlugins = runtime.global().getPropertyAsObject(runtime, "FrameProcessorPlugins");

  auto function = [pluginGlobal](jsi::Runtime& runtime,
                                 const jsi::Value& thisValue,
                                 const jsi::Value* arguments,
                                 size_t count) -> jsi::Value {
    // Unbox object and get typed HostObject
    auto boxedHostObject = arguments[0].asObject(runtime).asHostObject(runtime);
    auto frameHostObject = dynamic_cast<FrameHostObject*>(boxedHostObject.get());

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

  // Assign it to the Proxy.
  // A FP Plugin called "example_plugin" can be now called from JS using "FrameProcessorPlugins.example_plugin(frame)"
  frameProcessorPlugins.setProperty(runtime,
                                    pluginName.c_str(),
                                    jsi::Function::createFromHostFunction(runtime,
                                                                          jsi::PropNameID::forAscii(runtime, pluginName),
                                                                          1, // frame
                                                                          function));
}

} // namespace vision
