///
/// NativeThreadDispatcher.hpp
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

#pragma once

#include "JSIConverter+AsyncQueue.hpp"
#include <VisionCamera/HybridNativeThreadSpec.hpp>
#include <jsi/jsi.h>

namespace margelo::nitro::camera::worklets {

/**
 * An implementation of `nitro::Dispatcher` that uses a `NativeThread` to run its jobs.
 *
 * The `NativeThread` (`HybridNativeThreadSpec`) is a platform-implemented object,
 * e.g. using `DispatchQueue` on iOS.
 */
class NativeThreadDispatcher : public nitro::Dispatcher {
public:
  NativeThreadDispatcher(std::shared_ptr<HybridNativeThreadSpec> thread) : _thread(std::move(thread)) {}

  void runSync(std::function<void()>&&) override {
    throw std::runtime_error("runSync(...) is not implemented for NativeThreadDispatcher!");
  }
  void runAsync(std::function<void()>&& function) override {
    _thread->runOnThread(function);
  }

private:
  std::shared_ptr<HybridNativeThreadSpec> _thread;
};

} // namespace margelo::nitro::camera::worklets
