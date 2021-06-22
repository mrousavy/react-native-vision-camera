//
// Created by Marc Rousavy on 22.06.21.
//

#pragma once

#include <jsi/jsi.h>
#include <jni.h>
#include <fbjni/fbjni.h>

namespace vision {

using namespace facebook;

jobject convertJSIValueToJNIObject(const jsi::Runtime& runtime, const jsi::Value& value);

jsi::Value convertJNIObjectToJSIValue(const jsi::Runtime& runtime, const jobject& object);

}