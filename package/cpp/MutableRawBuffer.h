//
//  MutableRawBuffer.h
//  VisionCamera
//
//  Created by Marc Rousavy on 17.01.24.
//  Copyright © 2024 mrousavy. All rights reserved.
//

#pragma once

#include <functional>
#include <jsi/jsi.h>
#include <memory>

namespace vision {

using namespace facebook;

class MutableRawBuffer : public jsi::MutableBuffer {

public:
  explicit MutableRawBuffer(size_t size);
  explicit MutableRawBuffer(uint8_t* data, size_t size, std::function<void()> cleanup);
  ~MutableRawBuffer();

public:
  uint8_t* data() override;
  size_t size() const override;

private:
  uint8_t* _data;
  size_t _size;
  std::function<void()> _cleanup;
};

} // namespace vision
