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

jobject convertJSIValueToJNIObject(jsi::Runtime& runtime, const jsi::Value& value) {
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

      auto array = object.getArray(runtime);

      auto nativeArray = react::ReadableNativeArray::newObjectCxxArgs(jsi::dynamicFromValue(runtime, array));
      return nativeArray.release();

      // TODO: Legacy code, remove?
      /*
      int size = array.size(runtime);
      auto args = jni::JArrayClass<jobject>::newArray(size);
      for (size_t i = 0; i < size; i++) {
        // recursively converts the values to JNI objects
        args->setElement(i, convertJSIValueToJNIObject(runtime, array.getValueAtIndex(runtime, i)));
      }
      return args.release();
       */

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

      auto propertyNames = object.getPropertyNames(runtime);
      auto dynamic = jsi::dynamicFromValue(runtime, object);
      auto map = react::ReadableNativeMap::createWithContents(std::move(dynamic));
      return map.release();
using namespace facebook;

    }
  } else {
    // unknown jsi type!
    return nullptr;
  }
}

jsi::Value convertJNIObjectToJSIValue(const jsi::Runtime& runtime, const jobject& object) {
  return jsi::Value::undefined();
}

}