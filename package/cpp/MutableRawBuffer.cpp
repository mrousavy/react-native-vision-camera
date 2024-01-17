//
//  MutableRawBuffer.cpp
//  VisionCamera
//
//  Created by Marc Rousavy on 17.01.24.
//  Copyright © 2024 mrousavy. All rights reserved.
//

#include "MutableRawBuffer.h"
#include <functional>
#include <memory>

namespace vision {

MutableRawBuffer::MutableRawBuffer(uint8_t* data, size_t size, std::function<void()> cleanup)
    : _data(data), _size(size), _cleanup(std::move(cleanup)) {}

MutableRawBuffer::MutableRawBuffer(size_t size) {
  _size = size;
  _data = (uint8_t*)malloc(size * sizeof(uint8_t));
  _cleanup = [=]() { free(_data); };
}

MutableRawBuffer::~MutableRawBuffer() {
  _cleanup();
}

size_t MutableRawBuffer::size() const {
  return _size;
}

uint8_t* MutableRawBuffer::data() {
  return _data;
}

} // namespace vision
