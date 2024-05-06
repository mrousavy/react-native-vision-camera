//
// Created by Marc Rousavy on 22.06.21.
//

#include "JSIJNIConversion.h"

#include <android/log.h>
#include <fbjni/fbjni.h>
#include <jni.h>
#include <jsi/jsi.h>

#include <memory>
#include <string>
#include <utility>

#include "FrameHostObject.h"
#include "JFrame.h"
#include "JSharedArray.h"

namespace vision {

using namespace facebook;

jni::local_ref<jobject> JSIJNIConversion::convertJSIValueToJNIObject(jsi::Runtime& runtime, const jsi::Value& value) {
  if (value.isNull() || value.isUndefined()) {
    // null

    return nullptr;
  } else if (value.isBool()) {
    // Boolean

    bool boolean = value.getBool();
    return JBoolean::valueOf(boolean);
  } else if (value.isNumber()) {
    // Double

    double number = value.getNumber();
    return jni::JDouble::valueOf(number);
  } else if (value.isString()) {
    // String

    std::string string = value.getString(runtime).utf8(runtime);
    return jni::make_jstring(string);
  } else if (value.isObject()) {
    // Object

    auto valueAsObject = value.getObject(runtime);
    if (valueAsObject.isArray(runtime)) {
      // List<Object>

      jsi::Array array = valueAsObject.getArray(runtime);
      size_t size = array.size(runtime);
      jni::local_ref<JArrayList<jobject>> arrayList = jni::JArrayList<jobject>::create(static_cast<int>(size));
      for (size_t i = 0; i < size; i++) {
        jsi::Value item = array.getValueAtIndex(runtime, i);
        jni::local_ref<jobject> jniItem = convertJSIValueToJNIObject(runtime, item);
        arrayList->add(jniItem);
      }
      return arrayList;
    } else if (valueAsObject.isArrayBuffer(runtime)) {
      // ArrayBuffer/TypedArray

      jsi::ArrayBuffer arrayBuffer = valueAsObject.getArrayBuffer(runtime);
      return JSharedArray::create(runtime, std::move(arrayBuffer));

    } else if (valueAsObject.isHostObject(runtime)) {

      if (valueAsObject.isHostObject<FrameHostObject>(runtime)) {
        // Frame

        auto frameHostObject = valueAsObject.getHostObject<FrameHostObject>(runtime);
        return jni::make_local(frameHostObject->getFrame());

      } else {
        throw std::runtime_error("The given HostObject is not supported by a Frame Processor Plugin.");
      }

    } else {
      // Map<String, Object>

      jsi::Array propertyNames = valueAsObject.getPropertyNames(runtime);
      size_t size = propertyNames.size(runtime);
      jni::local_ref<JHashMap<jstring, jobject>> hashMap = jni::JHashMap<jstring, jobject>::create();
      for (size_t i = 0; i < size; i++) {
        jsi::String propName = propertyNames.getValueAtIndex(runtime, i).asString(runtime);
        jsi::Value item = valueAsObject.getProperty(runtime, propName);
        jni::local_ref<jstring> key = jni::make_jstring(propName.utf8(runtime));
        jni::local_ref<jobject> jniItem = convertJSIValueToJNIObject(runtime, item);
        hashMap->put(key, jniItem);
      }
      return hashMap;
    }
  } else {
    auto stringRepresentation = value.toString(runtime).utf8(runtime);
    throw std::runtime_error("Failed to convert jsi::Value to JNI value - unsupported type! " + stringRepresentation);
  }
}

jni::local_ref<jni::JMap<jstring, jobject>> JSIJNIConversion::convertJSIObjectToJNIMap(jsi::Runtime& runtime, const jsi::Object& object) {
  auto propertyNames = object.getPropertyNames(runtime);
  auto size = propertyNames.size(runtime);
  auto hashMap = jni::JHashMap<jstring, jobject>::create();

  for (size_t i = 0; i < size; i++) {
    jsi::String propName = propertyNames.getValueAtIndex(runtime, i).asString(runtime);
    jsi::Value value = object.getProperty(runtime, propName);
    jni::local_ref<jstring> key = jni::make_jstring(propName.utf8(runtime));
    jni::local_ref<jobject> jniValue = convertJSIValueToJNIObject(runtime, value);
    hashMap->put(key, jniValue);
  }

  return hashMap;
}

jsi::Value JSIJNIConversion::convertJNIObjectToJSIValue(jsi::Runtime& runtime, const jni::local_ref<jobject>& object) {
  if (object == nullptr) {
    // null

    return jsi::Value::undefined();
  } else if (object->isInstanceOf(jni::JBoolean::javaClassStatic())) {
    // Boolean

    auto boxed = static_ref_cast<JBoolean>(object);
    bool value = boxed->value();
    return jsi::Value(value);
  } else if (object->isInstanceOf(jni::JDouble::javaClassStatic())) {
    // Double

    auto boxed = static_ref_cast<JDouble>(object);
    double value = boxed->value();
    return jsi::Value(value);
  } else if (object->isInstanceOf(jni::JInteger::javaClassStatic())) {
    // Integer

    auto boxed = static_ref_cast<JInteger>(object);
    return jsi::Value(boxed->value());
  } else if (object->isInstanceOf(jni::JString::javaClassStatic())) {
    // String

    return jsi::String::createFromUtf8(runtime, object->toString());
  } else if (object->isInstanceOf(JList<jobject>::javaClassStatic())) {
    // List<E>

    auto arrayList = static_ref_cast<JList<jobject>>(object);
    auto size = arrayList->size();

    auto result = jsi::Array(runtime, size);
    size_t i = 0;
    for (const auto& item : *arrayList) {
      result.setValueAtIndex(runtime, i, convertJNIObjectToJSIValue(runtime, item));
      i++;
    }
    return result;
  } else if (object->isInstanceOf(JMap<jstring, jobject>::javaClassStatic())) {
    // Map<K, V>

    auto map = static_ref_cast<JMap<jstring, jobject>>(object);

    auto result = jsi::Object(runtime);
    for (const auto& entry : *map) {
      auto key = entry.first->toString();
      auto value = entry.second;
      auto jsiValue = convertJNIObjectToJSIValue(runtime, value);
      result.setProperty(runtime, key.c_str(), jsiValue);
    }
    return result;
  } else if (object->isInstanceOf(JFrame::javaClassStatic())) {
    // Frame
    auto frame = static_ref_cast<JFrame>(object);

    // box into HostObject
    auto hostObject = std::make_shared<FrameHostObject>(frame);
    return jsi::Object::createFromHostObject(runtime, hostObject);
  } else if (object->isInstanceOf(JSharedArray::javaClassStatic())) {
    // SharedArray
    auto sharedArray = static_ref_cast<JSharedArray::javaobject>(object);

    std::shared_ptr<jsi::ArrayBuffer> array = sharedArray->cthis()->getArrayBuffer();
    return array->getArrayBuffer(runtime);
  }

  auto type = object->getClass()->toString();
  auto message = "Cannot convert Java type \"" + type + "\" to jsi::Value!";
  __android_log_write(ANDROID_LOG_ERROR, "VisionCamera", message.c_str());
  throw std::runtime_error(message);
}

} // namespace vision
