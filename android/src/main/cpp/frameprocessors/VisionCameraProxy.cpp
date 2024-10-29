//
// Created by Marc Rousavy on 21.07.23.
//

#include "VisionCameraProxy.h"
#include <jsi/jsi.h>

#include "JFrameProcessor.h"
#include "JFrameProcessorPlugin.h"
#include "JSIJNIConversion.h"

#include <android/log.h>
#include <fbjni/fbjni.h>

#include "FrameProcessorPluginHostObject.h"

#include <memory>
#include <string>
#include <vector>

#if VISION_CAMERA_ENABLE_FRAME_PROCESSORS
#include <react-native-worklets-core/WKTJsiWorkletContext.h>
#endif

namespace vision {

using namespace facebook;

VisionCameraProxy::VisionCameraProxy(const jni::alias_ref<JVisionCameraProxy::javaobject>& javaProxy) {
  _javaProxy = make_global(javaProxy);
}

VisionCameraProxy::~VisionCameraProxy() {
  // Hermes GC might destroy HostObjects on an arbitrary Thread which might not be
  // connected to the JNI environment. To make sure fbjni can properly destroy
  // the Java method, we connect to a JNI environment first.
  jni::ThreadScope::WithClassLoader([&] { _javaProxy.reset(); });
}

std::vector<jsi::PropNameID> VisionCameraProxy::getPropertyNames(jsi::Runtime& runtime) {
  return jsi::PropNameID::names(runtime, "setFrameProcessor", "removeFrameProcessor", "initFrameProcessorPlugin", "workletContext");
}

void VisionCameraProxy::setFrameProcessor(int viewTag, jsi::Runtime& runtime, const std::shared_ptr<jsi::Function>& function) {
  _javaProxy->cthis()->setFrameProcessor(viewTag, runtime, function);
}

void VisionCameraProxy::removeFrameProcessor(int viewTag) {
  _javaProxy->cthis()->removeFrameProcessor(viewTag);
}

jsi::Value VisionCameraProxy::initFrameProcessorPlugin(jsi::Runtime& runtime, const std::string& name, const jsi::Object& jsOptions) {
  auto options = JSIJNIConversion::convertJSIObjectToJNIMap(runtime, jsOptions);

  auto plugin = _javaProxy->cthis()->initFrameProcessorPlugin(name, options);
  if (plugin == nullptr) {
    return jsi::Value::undefined();
  }

  auto pluginHostObject = std::make_shared<FrameProcessorPluginHostObject>(plugin);
  return jsi::Object::createFromHostObject(runtime, pluginHostObject);
}

jsi::Value VisionCameraProxy::get(jsi::Runtime& runtime, const jsi::PropNameID& propName) {
  auto name = propName.utf8(runtime);

  if (name == "setFrameProcessor") {
    return jsi::Function::createFromHostFunction(
        runtime, jsi::PropNameID::forUtf8(runtime, "setFrameProcessor"), 1,
        [this](jsi::Runtime& runtime, const jsi::Value& thisValue, const jsi::Value* arguments, size_t count) -> jsi::Value {
          auto viewTag = arguments[0].asNumber();
          auto frameProcessor = arguments[1].asObject(runtime).asFunction(runtime);
          auto sharedFunction = std::make_shared<jsi::Function>(std::move(frameProcessor));
          this->setFrameProcessor(static_cast<int>(viewTag), runtime, sharedFunction);
          return jsi::Value::undefined();
        });
  } else if (name == "removeFrameProcessor") {
    return jsi::Function::createFromHostFunction(
        runtime, jsi::PropNameID::forUtf8(runtime, "removeFrameProcessor"), 1,
        [this](jsi::Runtime& runtime, const jsi::Value& thisValue, const jsi::Value* arguments, size_t count) -> jsi::Value {
          auto viewTag = arguments[0].asNumber();
          this->removeFrameProcessor(static_cast<int>(viewTag));
          return jsi::Value::undefined();
        });
  } else if (name == "initFrameProcessorPlugin") {
    return jsi::Function::createFromHostFunction(
        runtime, jsi::PropNameID::forUtf8(runtime, "initFrameProcessorPlugin"), 1,
        [this](jsi::Runtime& runtime, const jsi::Value& thisValue, const jsi::Value* arguments, size_t count) -> jsi::Value {
          if (count < 1 || !arguments[0].isString()) {
            throw jsi::JSError(runtime, "First argument needs to be a string (pluginName)!");
          }
          auto pluginName = arguments[0].asString(runtime).utf8(runtime);
          auto options = count > 1 ? arguments[1].asObject(runtime) : jsi::Object(runtime);

          return this->initFrameProcessorPlugin(runtime, pluginName, options);
        });
  } else if (name == "workletContext") {
#if VISION_CAMERA_ENABLE_FRAME_PROCESSORS
    std::shared_ptr<RNWorklet::JsiWorkletContext> context = _javaProxy->cthis()->getWorkletContext();
    return jsi::Object::createFromHostObject(runtime, context);
#endif
  }

  return jsi::Value::undefined();
}

void VisionCameraInstaller::registerNatives() {
  javaClassStatic()->registerNatives({makeNativeMethod("install", VisionCameraInstaller::install)});
}

void VisionCameraInstaller::install(jni::alias_ref<jni::JClass>, jni::alias_ref<JVisionCameraProxy::javaobject> proxy) {
  // global.VisionCameraProxy
  auto visionCameraProxy = std::make_shared<VisionCameraProxy>(proxy);
  jsi::Runtime& runtime = *proxy->cthis()->getJSRuntime();
  runtime.global().setProperty(runtime, "VisionCameraProxy", jsi::Object::createFromHostObject(runtime, visionCameraProxy));
}

} // namespace vision
