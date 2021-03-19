#pragma once

#include <jsi/jsi.h>
#include <memory>

#if __has_include(<hermes/hermes.h>)
#include <hermes/hermes.h>
#else
#include <jsi/JSCRuntime.h>
#endif

using namespace facebook;

namespace vision {

static std::unique_ptr<jsi::Runtime> makeJSIRuntime() {
  #if __has_include(<hermes/hermes.h>)
  return facebook::hermes::makeHermesRuntime();
  #else
  return facebook::jsc::makeJSCRuntime();
  #endif
}

} // namespace vision
