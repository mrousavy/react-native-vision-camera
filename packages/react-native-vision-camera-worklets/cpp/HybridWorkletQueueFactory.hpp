///
/// HybridWorkletQueueFactory.hpp
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

#pragma once

#include "HybridWorkletQueueFactorySpec.hpp"
#include "JSIConverter+AsyncQueue.hpp"
#include <atomic>
#include <jsi/jsi.h>

namespace margelo::nitro::camera::worklets {

class HybridWorkletQueueFactory : public HybridWorkletQueueFactorySpec {
public:
  HybridWorkletQueueFactory();

public:
  std::shared_ptr<::worklets::AsyncQueue> wrapThreadInQueue(const std::shared_ptr<HybridNativeThreadSpec>& thread) override;
  double getCurrentThreadMarker() override;

  jsi::Value installDispatcher(jsi::Runtime& runtime, const jsi::Value&, const jsi::Value* args, size_t count);

  void loadHybridMethods() override;
};

} // namespace margelo::nitro::camera::worklets
