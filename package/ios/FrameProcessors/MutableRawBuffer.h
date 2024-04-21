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
  explicit MutableRawBuffer(size_t size) {
    _size = size;
    _data = new uint8_t[size];
  }
  ~MutableRawBuffer() {
    delete[] _data;
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
};

} // namespace vision
