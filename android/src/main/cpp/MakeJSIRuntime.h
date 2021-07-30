//
// Created by Marc Rousavy on 06.07.21.
//

#pragma once

#include <jsi/jsi.h>
#include <memory>

#if FOR_HERMES
  // Hermes
  #include <hermes/hermes.h>
#else
  // JSC
  #include <jsi/JSCRuntime.h>
#endif

namespace vision {

using namespace facebook;

static std::unique_ptr<jsi::Runtime> makeJSIRuntime() {
  #if FOR_HERMES
  return facebook::hermes::makeHermesRuntime();
  #else
  return facebook::jsc::makeJSCRuntime();
  #endif
}

} // namespace vision
