#pragma once

#include <jsi/jsi.h>
#include <memory>

#ifdef ON_ANDROID

// on Android we need to pass FOR_HERMES flag to determine if hermes is used or not since both headers are there.

#if FOR_HERMES
// Hermes
#include <hermes/hermes.h>
#else
// JSC
#include <jsi/JSCRuntime.h>
#endif

#else

// on iOS, we simply check by __has_include. Headers are only available if the sources are there too.

#if __has_include(<reacthermes/HermesExecutorFactory.h>)
// Hermes (https://hermesengine.dev) (RN 0.65+)
#include <reacthermes/HermesExecutorFactory.h>
#elif __has_include(<hermes/hermes.h>)
// Hermes (https://hermesengine.dev)
#include <hermes/hermes.h>
#elif __has_include(<v8runtime/V8RuntimeFactory.h>)
// V8 (https://github.com/Kudo/react-native-v8)
#include <v8runtime/V8RuntimeFactory.h>
#else
// JSC
#include <jsi/JSCRuntime.h>
#endif

#endif

using namespace facebook;

namespace vision {

static std::unique_ptr<jsi::Runtime> makeJSIRuntime() {
#ifdef ON_ANDROID

  #if FOR_HERMES
  return facebook::hermes::makeHermesRuntime();
  #else
  return facebook::jsc::makeJSCRuntime();
  #endif

#else

  #if __has_include(<hermes/hermes.h>) || __has_include(<reacthermes/HermesExecutorFactory.h>)
  return facebook::hermes::makeHermesRuntime();
  #elif __has_include(<v8runtime/V8RuntimeFactory.h>)
  return facebook::createV8Runtime("");
  #else
  return facebook::jsc::makeJSCRuntime();
  #endif

#endif
}

} // namespace vision
