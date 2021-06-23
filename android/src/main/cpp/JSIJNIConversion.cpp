//
// Created by Marc Rousavy on 22.06.21.
//

#include "JSIJNIConversion.h"

#include <jsi/jsi.h>
#include <jni.h>
#include <fbjni/fbjni.h>

#include <react/jni/NativeMap.h>
#include <react/jni/ReadableNativeMap.h>
#include <react/jni/WritableNativeMap.h>

#include <react/jni/MethodInvoker.h>

#include <jsi/JSIDynamic.h>
#include <folly/dynamic.h>

#include "JImageProxyHostObject.h"
#include "JImageProxy.h"

namespace vision {

using namespace facebook;

jobject JSIJNIConversion::convertJSIValueToJNIObject(jsi::Runtime &runtime, const jsi::Value &value) {
  // TODO: .get() or .release() ?

  if (value.isBool()) {
    // jsi::Bool

    auto boolean = jni::JBoolean::valueOf(value.getBool());
    return boolean.release();

  } else if (value.isNumber()) {
    // jsi::Number

    auto number = jni::JDouble::valueOf(value.getNumber());
    return number.release();

  } else if (value.isNull() || value.isUndefined()) {
    // jsi::undefined

    return nullptr;

  } else if (value.isString()) {
    // jsi::String

    auto string = jni::make_jstring(value.getString(runtime).utf8(runtime));
    return string.release();

  } else if (value.isObject()) {

    auto object = value.asObject(runtime);
    if (object.isArray(runtime)) {
      // jsi::Array

      auto dynamic = jsi::dynamicFromValue(runtime, value);
      auto nativeArray = react::ReadableNativeArray::newObjectCxxArgs(std::move(dynamic));
      return nativeArray.release();

    } else if (object.isHostObject(runtime)) {
      // jsi::HostObject

      auto boxedHostObject = object.getHostObject(runtime);
      auto hostObject = dynamic_cast<JImageProxyHostObject*>(boxedHostObject.get());
      if (hostObject != nullptr) {
        // return jni local_ref to the JImageProxy
        return hostObject->frame.get();
      } else {
        // it's different kind of HostObject. We don't support it.
        return nullptr;
      }

    } else if (object.isFunction(runtime)) {
      // jsi::Function

      // TODO: Convert Function to Callback
      return nullptr;

    } else {
      // jsi::Object

      auto dynamic = jsi::dynamicFromValue(runtime, value);
      auto map = react::ReadableNativeMap::createWithContents(std::move(dynamic));
      return map.release();

    }
  } else {
    // unknown jsi type!
    return nullptr;
  }
}

jsi::Value JSIJNIConversion::convertJNIObjectToJSIValue(jsi::Runtime &runtime, const jni::alias_ref<jobject>& object) {
  if (object->isInstanceOf(jni::JBoolean::javaClassStatic())) {

    auto value = reinterpret_cast<jni::JBoolean*>(object.get());
    return jsi::Value(value->booleanValue() == true);

  } else if (object->isInstanceOf(jni::JDouble::javaClassStatic())) {

    auto value = reinterpret_cast<jni::JDouble*>(object.get());
    return jsi::Value(value->doubleValue());

  } else if (object->isInstanceOf(jni::JInteger::javaClassStatic())) {

    auto value = reinterpret_cast<jni::JInteger*>(object.get());
    return jsi::Value(value->intValue());

  } else if (object->isInstanceOf(jni::JString::javaClassStatic())) {

    auto value = reinterpret_cast<jni::JString*>(object.get());
    return jsi::String::createFromUtf8(runtime, value->toString());

  } else if (object->isInstanceOf(react::ReadableNativeArray::javaClassStatic())) {

    auto value = reinterpret_cast<react::ReadableNativeArray*>(object.get());
    return jsi::valueFromDynamic(runtime, value->consume());

  } else if (object->isInstanceOf(react::ReadableNativeMap::javaClassStatic())) {

    auto value = reinterpret_cast<react::ReadableNativeMap*>(object.get());
    return jsi::valueFromDynamic(runtime, value->consume());

  }

  return jsi::Value::undefined();
}

} // namespace vision