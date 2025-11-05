///
/// NativeThreadAsyncQueue.hpp
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

#pragma once

#include <jsi/jsi.h>
#include "HybridNativeThreadSpec.hpp"
#include "JSIConverter+AsyncQueue.hpp"

namespace margelo::nitro::camera {

/**
 * An implementation of `worklets::AsyncQueue` that uses a `NativeThread` to run it's jobs.
 *
 * The `NativeThread` (`HybridNativeThreadSpec`) is a platform-implemented object,
 * e.g. using `DispatchQueue` on iOS.
 */
class NativeThreadAsyncQueue: public worklets::AsyncQueue {
public:
  NativeThreadAsyncQueue(std::shared_ptr<HybridNativeThreadSpec> thread): _thread(std::move(thread)) { }
  
  void push(std::function<void()>&& job) override {
    auto jobCopy = job;
    _thread->runOnThread(jobCopy);
  }

private:
  std::shared_ptr<HybridNativeThreadSpec> _thread;
};

}
