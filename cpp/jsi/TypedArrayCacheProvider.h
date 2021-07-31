//
//  TypedArrayCacheProvider.h
//  VisionCamera
//
//  Created by Marc Rousavy on 31.07.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

#pragma once

#include <jsi/jsi.h>
#include "../../cpp/jsi/TypedArray.h"

namespace vision {

using namespace facebook;

template <TypedArrayKind T>
class TypedArrayCacheProvider {
  
public:
  explicit TypedArrayCacheProvider(jsi::Runtime& runtime): runtime(runtime) {}
  
public:
  std::vector<TypedArray<T>>& getArrayBufferCache(size_t bufferSize, size_t arraysCount) {
    if (this->arrayBuffers.size() != arraysCount) {
      arrayBuffers.reserve(arraysCount);
      for (size_t i = 0; i < arraysCount; i++) {
        arrayBuffers.push_back(TypedArray<T>(runtime, bufferSize));
      }
    }
    
    return arrayBuffers;
  }
  
private:
  jsi::Runtime& runtime;
  std::vector<TypedArray<T>> arrayBuffers;
};


} // namespace vision
