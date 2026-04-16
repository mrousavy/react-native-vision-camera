///
/// NativeThreadAsyncQueue.hpp
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

#pragma once

#include "JSIConverter+AsyncQueue.hpp"
#include <VisionCamera/HybridNativeThreadSpec.hpp>
#include <jsi/jsi.h>

namespace margelo::nitro::camera::worklets {

/**
 * An implementation of `worklets::AsyncQueue` that uses a `NativeThread` to run its jobs.
 *
 * The `NativeThread` (`HybridNativeThreadSpec`) is a platform-implemented object,
 * e.g. using `DispatchQueue` on iOS.
 */
class NativeThreadAsyncQueue : public ::worklets::AsyncQueue {
public:
  explicit NativeThreadAsyncQueue(std::shared_ptr<HybridNativeThreadSpec> thread) : _thread(std::move(thread)) {}

  void push(std::function<void()>&& job) override {
    auto jobCopy = job;
    _thread->runOnThread(jobCopy);
  }

private:
  std::shared_ptr<HybridNativeThreadSpec> _thread;
};

} // namespace margelo::nitro::camera::worklets
