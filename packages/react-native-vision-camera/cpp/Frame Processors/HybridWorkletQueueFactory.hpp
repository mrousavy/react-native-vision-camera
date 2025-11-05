///
/// HybridWorkletQueueFactory.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

#pragma once

#include <jsi/jsi.h>
#include "HybridWorkletQueueFactorySpec.hpp"
#include "JSIConverter+AsyncQueue.hpp"
#include "NativeThreadAsyncQueue.hpp"

namespace margelo::nitro::camera {

class HybridWorkletQueueFactory: public HybridWorkletQueueFactorySpec {
public:
  HybridWorkletQueueFactory(): HybridObject(TAG) { }
  
public:
  std::shared_ptr<worklets::AsyncQueue> wrapThreadInQueue(const std::shared_ptr<HybridNativeThreadSpec>& thread) override {
    return std::make_shared<NativeThreadAsyncQueue>(thread);
  }
};

}
