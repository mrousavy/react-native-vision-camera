//
// Created by Marc Rousavy on 17.01.24.
//

#include "MutableJByteBuffer.h"

#include <fbjni/ByteBuffer.h>
#include <fbjni/fbjni.h>
#include <jsi/jsi.h>

namespace vision {

MutableJByteBuffer::MutableJByteBuffer(jni::alias_ref<jni::JByteBuffer> byteBuffer) {
  _byteBuffer = jni::make_global(byteBuffer);
}

MutableJByteBuffer::~MutableJByteBuffer() {
  // Hermes GC might destroy HostObjects on an arbitrary Thread which might not be
  // connected to the JNI environment. To make sure fbjni can properly destroy
  // the Java method, we connect to a JNI environment first.
  jni::ThreadScope::WithClassLoader([&] { _byteBuffer.reset(); });
}

uint8_t* MutableJByteBuffer::data() {
  return _byteBuffer->getDirectBytes();
}

size_t MutableJByteBuffer::size() const {
  return _byteBuffer->getDirectSize();
}

jni::global_ref<jni::JByteBuffer> MutableJByteBuffer::getByteBuffer() {
  return _byteBuffer;
}

} // namespace vision
