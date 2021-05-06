#pragma once

#include <jsi/jsi.h>
#include <memory>

#if __has_include(<hermes/hermes.h>)
// Hermes (https://hermesengine.dev)
#include <hermes/hermes.h>
#elif __has_include(<v8runtime/V8RuntimeFactory.h>)
// V8 (https://github.com/Kudo/react-native-v8)
#include <v8runtime/V8RuntimeFactory.h>
#else
// JSC
#include <jsi/JSCRuntime.h>
#endif

using namespace facebook;

namespace vision {

static std::unique_ptr<jsi::Runtime> makeJSIRuntime() {
  #if __has_include(<hermes/hermes.h>)
  return facebook::hermes::makeHermesRuntime();
  #elif __has_include(<v8runtime/V8RuntimeFactory.h>)
  return facebook::createV8Runtime("");
  #else
  return facebook::jsc::makeJSCRuntime();
  #endif
}

} // namespace vision
