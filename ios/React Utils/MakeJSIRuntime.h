//
//  MakeJSIRuntime.h
//  VisionCamera
//
//  Created by Marc Rousavy on 06.07.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

#pragma once

#include <jsi/jsi.h>
#include <memory>

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

using namespace facebook;

namespace vision {

static std::unique_ptr<jsi::Runtime> makeJSIRuntime() {
#if __has_include(<hermes/hermes.h>) || __has_include(<reacthermes/HermesExecutorFactory.h>)
  return facebook::hermes::makeHermesRuntime();
#elif __has_include(<v8runtime/V8RuntimeFactory.h>)
  return facebook::createV8Runtime("");
#else
  return facebook::jsc::makeJSCRuntime();
#endif
}

} // namespace vision
