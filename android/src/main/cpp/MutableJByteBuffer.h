//
// Created by Marc Rousavy on 17.01.24.
//

#pragma once

#include <fbjni/ByteBuffer.h>
#include <fbjni/fbjni.h>
#include <jsi/jsi.h>
#include <memory>

namespace vision {

using namespace facebook;

class MutableJByteBuffer : public jsi::MutableBuffer {
public:
  /**
   * Wraps the given JByteBuffer in a MutableBuffer for use in JS.
   */
  explicit MutableJByteBuffer(jni::alias_ref<jni::JByteBuffer> byteBuffer);
  ~MutableJByteBuffer();

public:
  uint8_t* data() override;
  size_t size() const override;
  jni::global_ref<jni::JByteBuffer> getByteBuffer();

private:
  jni::global_ref<jni::JByteBuffer> _byteBuffer;
};

} // namespace vision
