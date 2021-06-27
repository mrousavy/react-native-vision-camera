//
// Created by Marc Rousavy on 22.06.21.
//

#include "JSIJNIConversion.h"

#include <jsi/jsi.h>
#include <jni.h>
#include <fbjni/fbjni.h>
#include <android/log.h>

#include <string>
#include <utility>

#include <react/jni/NativeMap.h>
#include <react/jni/ReadableNativeMap.h>
#include <react/jni/WritableNativeMap.h>

#include <jsi/JSIDynamic.h>
#include <folly/dynamic.h>

#include "JImageProxyHostObject.h"
#include "JImageProxy.h"
#include "JReadableArray.h"
#include "JReadableMap.h"
#include "JArrayList.h"
#include "JHashMap.h"

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
    // jsi::Object

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
    auto stringRepresentation = value.toString(runtime).utf8(runtime);
    auto message = "Received unknown JSI value! (" + stringRepresentation + ") Cannot convert to JNI Object.";
    __android_log_write(ANDROID_LOG_ERROR, "VisionCamera", message.c_str());
    return nullptr;
  }
}

jsi::Value JSIJNIConversion::convertJNIObjectToJSIValue(jsi::Runtime &runtime, const jni::local_ref<jobject>& object) {
  if (object->isInstanceOf(jni::JBoolean::javaClassStatic())) {
    // Boolean

    static const auto getBooleanFunc = jni::findClassLocal("java/lang/Boolean")->getMethod<jboolean()>("booleanValue");
    auto boolean = getBooleanFunc(object.get());
    return jsi::Value(boolean == true);

  } else if (object->isInstanceOf(jni::JDouble::javaClassStatic())) {
    // Double

    static const auto getDoubleFunc = jni::findClassLocal("java/lang/Double")->getMethod<jdouble()>("doubleValue");
    auto d = getDoubleFunc(object.get());
    return jsi::Value(d);

  } else if (object->isInstanceOf(jni::JInteger::javaClassStatic())) {
    // Integer

    static const auto getIntegerFunc = jni::findClassLocal("java/lang/Integer")->getMethod<jint()>("integerValue");
    auto i = getIntegerFunc(object.get());
    return jsi::Value(i);

  } else if (object->isInstanceOf(jni::JString::javaClassStatic())) {
    // String

    return jsi::String::createFromUtf8(runtime, object->toString());

  } else if (object->isInstanceOf(JReadableArray::javaClassStatic())) {
    // ReadableArray

    static const auto toArrayListFunc = JReadableArray::javaClassLocal()->getMethod<jni::JArrayClass<jobject>()>("toArrayList");

    auto array = toArrayListFunc(object.get());
    auto size = array->size();

    auto result = jsi::Array(runtime, size);
    for (size_t i = 0; i < size; i++) {
      result.setValueAtIndex(runtime, i, convertJNIObjectToJSIValue(runtime, (*array)[i]));
    }
    return result;

  } else if (object->isInstanceOf(JArrayList::javaClassStatic())) {
    // ArrayList

    static const auto iteratorFunc = JArrayList::javaClassLocal()->getMethod<jni::JIterator<jobject>()>("iterator");
    static const auto sizeFunc = JArrayList::javaClassLocal()->getMethod<jint()>("size");

    auto iterator = iteratorFunc(object.get());
    auto size = sizeFunc(object.get());

    auto result = jsi::Array(runtime, size);
    size_t i = 0;
    for (auto& item : *iterator) {
      result.setValueAtIndex(runtime, i, convertJNIObjectToJSIValue(runtime, item));
      i++;
    }
    return result;

  } else if (object->isInstanceOf(JReadableMap::javaClassStatic())) {
    // ReadableMap

    static const auto toHashMapFunc = JReadableMap::javaClassLocal()->getMethod<jni::JHashMap<jstring, jobject>()>("toHashMap");
    auto hashMap = toHashMapFunc(object.get());

    auto result = jsi::Object(runtime);

    for (const auto& entry : *hashMap) {
      auto key = entry.first->toString();
      auto value = entry.second;
      auto jsiValue = convertJNIObjectToJSIValue(runtime, value);
      result.setProperty(runtime, key.c_str(), jsiValue);
    }

    return result;
  }

  auto type = object->getClass()->toString();
  auto message = "Received unknown JNI type \"" + type + "\"! Cannot convert to jsi::Value.";
  __android_log_write(ANDROID_LOG_ERROR, "VisionCamera", message.c_str());
  return jsi::Value::undefined();
}

} // namespace vision
