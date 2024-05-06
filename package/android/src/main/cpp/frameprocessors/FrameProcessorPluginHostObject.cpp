//
// Created by Marc Rousavy on 21.07.23.
//

#include "FrameProcessorPluginHostObject.h"
#include "FrameHostObject.h"
#include "JSIJNIConversion.h"
#include <string>
#include <vector>

namespace vision {

using namespace facebook;

FrameProcessorPluginHostObject::FrameProcessorPluginHostObject(jni::alias_ref<JFrameProcessorPlugin::javaobject> plugin)
    : _plugin(make_global(plugin)) {}

FrameProcessorPluginHostObject::~FrameProcessorPluginHostObject() {
  // Hermes GC might destroy HostObjects on an arbitrary Thread which might not be
  // connected to the JNI environment. To make sure fbjni can properly destroy
  // the Java method, we connect to a JNI environment first.
  jni::ThreadScope::WithClassLoader([&] { _plugin.reset(); });
}

std::vector<jsi::PropNameID> FrameProcessorPluginHostObject::getPropertyNames(jsi::Runtime& runtime) {
  return jsi::PropNameID::names(runtime, "call");
}

jsi::Value FrameProcessorPluginHostObject::get(jsi::Runtime& runtime, const jsi::PropNameID& propName) {
  auto name = propName.utf8(runtime);

  if (name == "call") {
    return jsi::Function::createFromHostFunction(
        runtime, jsi::PropNameID::forUtf8(runtime, "call"), 2,
        [=](jsi::Runtime& runtime, const jsi::Value& thisValue, const jsi::Value* arguments, size_t count) -> jsi::Value {
          // Frame is first argument
          auto frameHolder = arguments[0].asObject(runtime);
          std::shared_ptr<FrameHostObject> frameHostObject;
          if (frameHolder.isHostObject<FrameHostObject>(runtime)) {
            // User directly passed FrameHostObject
            frameHostObject = frameHolder.getHostObject<FrameHostObject>(runtime);
          } else {
            // User passed a wrapper, e.g. DrawableFrame which contains the FrameHostObject as a hidden property
            jsi::Object actualFrame = frameHolder.getPropertyAsObject(runtime, "__frame");
            frameHostObject = actualFrame.asHostObject<FrameHostObject>(runtime);
          }
          auto frame = frameHostObject->getFrame();

          // Options are second argument (possibly undefined)
          local_ref<JMap<jstring, jobject>> options = nullptr;
          if (count > 1) {
            options = JSIJNIConversion::convertJSIObjectToJNIMap(runtime, arguments[1].asObject(runtime));
          }

          // Call actual plugin
          auto result = _plugin->callback(frame, options);

          // Convert result value to jsi::Value (possibly undefined)
          return JSIJNIConversion::convertJNIObjectToJSIValue(runtime, result);
        });
  }

  return jsi::Value::undefined();
}

} // namespace vision
