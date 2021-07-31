//
//  TypedArrayCacheProvider.h
//  VisionCamera
//
//  Created by Marc Rousavy on 31.07.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

#pragma once

#include "../../cpp/jsi/TypedArray.h"
#include <jsi/jsi.h>
#include <unordered_map>

namespace vision {

using namespace facebook;

template <TypedArrayKind T>
class TypedArrayCacheProvider {
  
public:
  explicit TypedArrayCacheProvider(jsi::Runtime& runtime): runtime(runtime) {}
  
public:
  TypedArray<T>& getArrayBufferCache(size_t arrayBufferIndex, size_t bufferSize) {
    auto element = arrayBuffers.find(arrayBufferIndex);
    if (element == arrayBuffers.end() || element->second->size(runtime) != bufferSize) {
      arrayBuffers[arrayBufferIndex] = std::make_unique<TypedArray<T>>(runtime, bufferSize);
    }
    
    return *arrayBuffers[arrayBufferIndex];
  }
  
private:
  jsi::Runtime& runtime;
  std::unordered_map<size_t, std::unique_ptr<TypedArray<T>>> arrayBuffers;
};


} // namespace vision
