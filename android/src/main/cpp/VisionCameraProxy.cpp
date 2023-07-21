//
// Created by Marc Rousavy on 21.07.23.
//

#include "VisionCameraProxy.h"
#include <jsi/jsi.h>

#include <react-native-worklets/WKTJsiWorklet.h>
#include <react-native-worklets/WKTJsiHostObject.h>

#include "java-bindings/JCameraView.h"
#include "java-bindings/JFrameProcessor.h"
#include "java-bindings/JFrameProcessorPlugin.h"
#include "FrameProcessorPluginHostObject.h"
#include "FrameHostObject.h"
#include "JSIJNIConversion.h"
#include "JSITypedArray.h"

#include <android/log.h>

namespace vision {

using namespace facebook;

VisionCameraProxy::VisionCameraProxy(jsi::Runtime& runtime,
                                     std::shared_ptr<react::CallInvoker> callInvoker,
                                     jni::global_ref<JVisionCameraScheduler::javaobject> scheduler) {
  _callInvoker = callInvoker;
  _scheduler = scheduler;

  __android_log_write(ANDROID_LOG_INFO, TAG, "Creating Worklet Context...");

  auto runOnJS = [callInvoker](std::function<void()>&& f) {
    // Run on React JS Runtime
    callInvoker->invokeAsync(std::move(f));
  };
  auto runOnWorklet = [this](std::function<void()>&& f) {
      // Run on Frame Processor Worklet Runtime
    _scheduler->cthis()->dispatchAsync([f = std::move(f)](){
        f();
    });
  };
  _workletContext = std::make_shared<RNWorklet::JsiWorkletContext>("VisionCamera",
                                                                   &runtime,
                                                                   runOnJS,
                                                                   runOnWorklet);
  __android_log_write(ANDROID_LOG_INFO, TAG, "Worklet Context created!");
}

VisionCameraProxy::~VisionCameraProxy() {
  __android_log_write(ANDROID_LOG_INFO, TAG, "Destroying Context...");
  // Destroy ArrayBuffer cache for both the JS and the Worklet Runtime.
  vision::invalidateArrayBufferCache(*_workletContext->getJsRuntime());
  vision::invalidateArrayBufferCache(_workletContext->getWorkletRuntime());
}

std::vector<jsi::PropNameID> VisionCameraProxy::getPropertyNames(jsi::Runtime& runtime) {
  std::vector<jsi::PropNameID> result;
  result.push_back(jsi::PropNameID::forUtf8(runtime, std::string("setFrameProcessor")));
  result.push_back(jsi::PropNameID::forUtf8(runtime, std::string("removeFrameProcessor")));
  result.push_back(jsi::PropNameID::forUtf8(runtime, std::string("getFrameProcessorPlugin")));
  result.push_back(jsi::PropNameID::forUtf8(runtime, std::string("isSkiaEnabled")));
  return result;
}

jni::global_ref<JCameraView::javaobject> VisionCameraProxy::findCameraViewById(int viewId) {
  // TODO: implement findCameraViewById
  /*static const auto findCameraViewByIdMethod = javaPart_->getClass()->getMethod<CameraView(jint)>("findCameraViewById");
  auto weakCameraView = findCameraViewByIdMethod(javaPart_.get(), viewId);
  return make_global(weakCameraView);*/
  return nullptr;
}

void VisionCameraProxy::setFrameProcessor(jsi::Runtime& runtime, int viewTag, const jsi::Object& object) {
  auto frameProcessorType = object.getProperty(runtime, "type").asString(runtime).utf8(runtime);
  auto worklet = std::make_shared<RNWorklet::JsiWorklet>(runtime, object.getProperty(runtime, "frameProcessor"));

  auto view = findCameraViewById(viewTag);
  JFrameProcessor frameProcessor(worklet, _workletContext);

  // TODO: Set frame processor on JCameraView
}

void VisionCameraProxy::removeFrameProcessor(jsi::Runtime& runtime, int viewTag) {
  auto view = findCameraViewById(viewTag);

  // TODO: Remove frame processor from JCameraView
}

jsi::Value VisionCameraProxy::getFrameProcessorPlugin(jsi::Runtime& runtime, std::string name, const jsi::Object& options) {
  // TODO: Get Frame Processor Plugin here

  auto pluginHostObject = std::make_shared<FrameProcessorPluginHostObject>(plugin, _callInvoker);
  return jsi::Object::createFromHostObject(runtime, pluginHostObject);
}

jsi::Value VisionCameraProxy::get(jsi::Runtime& runtime, const jsi::PropNameID& propName) {
  auto name = propName.utf8(runtime);

  if (name == "isSkiaEnabled") {
#ifdef VISION_CAMERA_ENABLE_SKIA
    return jsi::Value(true);
#else
    return jsi::Value(false);
#endif
  }
  if (name == "setFrameProcessor") {
    return jsi::Function::createFromHostFunction(runtime,
                                                 jsi::PropNameID::forUtf8(runtime, "setFrameProcessor"),
                                                 1,
                                                 [this](jsi::Runtime& runtime,
                                                        const jsi::Value& thisValue,
                                                        const jsi::Value* arguments,
                                                        size_t count) -> jsi::Value {
      auto viewTag = arguments[0].asNumber();
      auto object = arguments[1].asObject(runtime);
      this->setFrameProcessor(runtime, static_cast<int>(viewTag), object);
      return jsi::Value::undefined();
    });
  }
  if (name == "removeFrameProcessor") {
    return jsi::Function::createFromHostFunction(runtime,
                                                 jsi::PropNameID::forUtf8(runtime, "removeFrameProcessor"),
                                                 1,
                                                 [this](jsi::Runtime& runtime,
                                                        const jsi::Value& thisValue,
                                                        const jsi::Value* arguments,
                                                        size_t count) -> jsi::Value {
      auto viewTag = arguments[0].asNumber();
      this->removeFrameProcessor(runtime, static_cast<int>(viewTag));
      return jsi::Value::undefined();
    });
  }
  if (name == "getFrameProcessorPlugin") {
    return jsi::Function::createFromHostFunction(runtime,
                                                 jsi::PropNameID::forUtf8(runtime, "getFrameProcessorPlugin"),
                                                 1,
                                                 [this](jsi::Runtime& runtime,
                                                        const jsi::Value& thisValue,
                                                        const jsi::Value* arguments,
                                                        size_t count) -> jsi::Value {
      if (count < 1 || !arguments[0].isString()) {
        throw jsi::JSError(runtime, "First argument needs to be a string (pluginName)!");
      }
      auto pluginName = arguments[0].asString(runtime).utf8(runtime);
      auto options = count > 1 ? arguments[1].asObject(runtime) : jsi::Object(runtime);

      return this->getFrameProcessorPlugin(runtime, pluginName, options);
    });
  }

  return jsi::Value::undefined();
}


void VisionCameraInstaller::install(jni::alias_ref<jni::JClass>,
                                    jlong jsiRuntimePtr,
                                    jni::alias_ref<react::CallInvokerHolder::javaobject> callInvokerHolder,
                                    jni::alias_ref<JVisionCameraScheduler::javaobject> scheduler) {
  // cast from JNI hybrid objects to C++ instances
  jsi::Runtime& runtime = *reinterpret_cast<jsi::Runtime*>(jsiRuntimePtr);
  std::shared_ptr<react::CallInvoker> callInvoker = callInvokerHolder->cthis()->getCallInvoker();
  jni::global_ref<JVisionCameraScheduler::javaobject> sharedScheduler = make_global(scheduler);

  // global.VisionCameraProxy
  auto visionCameraProxy = std::make_shared<VisionCameraProxy>(runtime, callInvoker, sharedScheduler);
  runtime.global().setProperty(runtime,
                               "VisionCameraProxy",
                               jsi::Object::createFromHostObject(runtime, visionCameraProxy));
}

}