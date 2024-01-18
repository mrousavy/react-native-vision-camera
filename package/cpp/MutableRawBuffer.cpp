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

MutableRawBuffer::MutableRawBuffer(uint8_t* data, size_t size, bool freeOnDealloc)
    : _data(data), _size(size), _freeOnDealloc(freeOnDealloc) {}

MutableRawBuffer::MutableRawBuffer(size_t size) {
  _size = size;
  _data = (uint8_t*)malloc(size * sizeof(uint8_t));
  _freeOnDealloc = true;
}

MutableRawBuffer::~MutableRawBuffer() {
  if (_freeOnDealloc) {
    free(_data);
  }
}

size_t MutableRawBuffer::size() const {
  return _size;
}

uint8_t* MutableRawBuffer::data() {
  return _data;
}

} // namespace vision
