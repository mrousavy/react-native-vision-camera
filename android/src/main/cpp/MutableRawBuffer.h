//
//  MutableRawBuffer.h
//  VisionCamera
//
//  Created by Marc Rousavy on 17.01.24.
//  Copyright © 2024 mrousavy. All rights reserved.
//

#pragma once

#include <jsi/jsi.h>
#include <memory>

namespace vision {

using namespace facebook;

class MutableRawBuffer : public jsi::MutableBuffer {

public:
  explicit MutableRawBuffer(uint8_t* data, size_t size, bool freeOnDealloc) {
    _size = size;
    _data = data;
    _freeOnDealloc = freeOnDealloc;
  }
  explicit MutableRawBuffer(size_t size) : MutableRawBuffer(new uint8_t[size], size, true) {}

  ~MutableRawBuffer() {
    if (_freeOnDealloc) {
      delete[] _data;
    }
  }

public:
  uint8_t* data() override {
    return _data;
  }
  size_t size() const override {
    return _size;
  }

private:
  uint8_t* _data;
  size_t _size;
  bool _freeOnDealloc;
};

} // namespace vision
