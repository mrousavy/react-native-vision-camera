//
// Created by Marc Rousavy on 22.06.21.
//

#include "JSIJNIConversion.h"

#include <jsi/jsi.h>
#include <jni.h>
#include <fbjni/fbjni.h>
#include <android/log.h>

#include <react/jni/NativeMap.h>
#include <react/jni/ReadableNativeMap.h>
#include <react/jni/WritableNativeMap.h>

#include <jsi/JSIDynamic.h>
#include <folly/dynamic.h>

#include "JImageProxyHostObject.h"
#include "JImageProxy.h"

namespace vision {

using namespace facebook;

jobject JSIJNIConversion::convertJSIValueToJNIObject(jsi::Runtime &runtime, const jsi::Value &value) {
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

jsi::Value JSIJNIConversion::convertJNIObjectToJSIValue(jsi::Runtime &runtime, const jni::local_ref<jobject>& object) {

  if (object->isInstanceOf(jni::JBoolean::javaClassStatic())) {

    static const auto getBooleanFunc = jni::findClassLocal("java/lang/Boolean")->getMethod<jboolean()>("booleanValue");
    auto boolean = getBooleanFunc(object.get());
    return jsi::Value(boolean == true);

  } else if (object->isInstanceOf(jni::JDouble::javaClassStatic())) {

    static const auto getDoubleFunc = jni::findClassLocal("java/lang/Double")->getMethod<jdouble()>("doubleValue");
    auto d = getDoubleFunc(object.get());
    return jsi::Value(d);

  } else if (object->isInstanceOf(jni::JInteger::javaClassStatic())) {

    static const auto getIntegerFunc = jni::findClassLocal("java/lang/Integer")->getMethod<jint()>("integerValue");
    auto i = getIntegerFunc(object.get());
    return jsi::Value(i);

  } else if (object->isInstanceOf(jni::JString::javaClassStatic())) {

    return jsi::String::createFromUtf8(runtime, object->toString());

  } else if (object->isInstanceOf(react::ReadableNativeArray::javaClassStatic())) {

    static const auto toArrayListFunc = jni::findClassLocal("com/facebook/react/bridge/ReadableNativeArray")->getMethod<jni::JArrayClass<jobject>()>("toArrayList");

    auto array = toArrayListFunc(object.get());
    auto size = array->size();

    auto result = jsi::Array(runtime, size);
    for (size_t i = 0; i < size; i++) {
      result.setValueAtIndex(runtime, i, convertJNIObjectToJSIValue(runtime, (*array)[i]));
    }
    return result;

  } else if (object->isInstanceOf(react::ReadableNativeMap::javaClassStatic())) {

    return nullptr;
    // TODO: This does not work because toHashMap returns a generic type (HashMap<K, V>)
    static const auto toHashMapFunc = jni::findClassLocal("com/facebook/react/bridge/ReadableMap")->getMethod<jobject()>("toHashMap");
    auto hashMap = toHashMapFunc(object.get());

    static const auto keySetFunc = jni::findClassLocal("java/util/HashMap")->getMethod<jobject()>("keySet");
    auto keySet = keySetFunc(hashMap.get());

    static const auto toArrayFunc = jni::findClassLocal("java/util/Set")->getMethod<jni::JArrayClass<jni::JString>()>("toArray");
    auto keys = toArrayFunc(keySet.get());

    auto map = jsi::Object(runtime);
    static const auto getFunc = jni::findClassLocal("java/util/HashMap")->getMethod<jobject(jstring)>("get");

    for (size_t i = 0; i < keys->size(); i++) {
      auto key = keys->getElement(i);
      auto value = getFunc(hashMap.get(), key.get());
      auto jsiValue = convertJNIObjectToJSIValue(runtime, value);
      map.setProperty(runtime, key->toString().c_str(), jsiValue);
    }

    return map;

  }

  __android_log_write(ANDROID_LOG_ERROR, "VisionCamera", "Received unknown JNI type! Cannot convert to jsi::Value.");
  return jsi::Value::undefined();
}

} // namespace vision