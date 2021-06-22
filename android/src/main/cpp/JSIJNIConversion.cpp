//
// Created by Marc Rousavy on 22.06.21.
//

#include "JSIJNIConversion.h"

#include <jsi/jsi.h>
#include <jni.h>
#include <fbjni/fbjni.h>

namespace vision {

jvalue convertJSIValueToJNIObject(jsi::Runtime& runtime, const jsi::Value& value) {
  jvalue jarg;

  if (value.isBool()) {
    jarg.z = value.getBool();
  } else if (value.isNumber()) {
    jarg.d = value.getNumber();
  } else if (value.isNull() || value.isUndefined()) {
    // no-op
  } else if (value.isString()) {
    auto string = value.getString(runtime);
    auto jstring = jni::make_jstring(string.utf8(runtime));
    // TODO: assign string
    //jarg.l = jstring;
  } else if (value.isObject()) {
    // TODO: Convert
    //  Object -> Map
    //  Array -> Array
    //  JImageProxy -> ImageProxy
  }

  return jarg;
}

jsi::Value convertJNIObjectToJSIValue(const jsi::Runtime& runtime, const jobject& object) {
  return jsi::Value::undefined();
}

}