///
/// NativeBufferHelper.cpp
/// Copyright © Marc Rousavy @ Margelo
///

#include "NativeBufferHelper.hpp"
#include <android/hardware_buffer.h>
#include <android/hardware_buffer_jni.h>

namespace margelo::nitro::camera {

using namespace facebook;

jlong NativeBufferHelper::getHardwareBufferPointer(jni::alias_ref<jni::JClass>, jni::alias_ref<jni::JObject> hardwareBufferBoxed) {
#if __ANDROID_API__ >= 26
  AHardwareBuffer* hardwareBuffer = AHardwareBuffer_fromHardwareBuffer(jni::Environment::current(), hardwareBufferBoxed.get());
  AHardwareBuffer_acquire(hardwareBuffer);
  uintptr_t memoryAddress = reinterpret_cast<uintptr_t>(hardwareBuffer);
  return static_cast<jlong>(memoryAddress);
#else
  throw std::runtime_error("HardwareBuffers require minSdk 26 or higher!");
#endif
}

void NativeBufferHelper::releaseHardwareBufferPointer(jni::alias_ref<jni::JClass>, jlong hardwareBufferPointer) {
#if __ANDROID_API__ >= 26
  AHardwareBuffer* hardwareBuffer = reinterpret_cast<AHardwareBuffer*>(hardwareBufferPointer);
  AHardwareBuffer_release(hardwareBuffer);
#else
  throw std::runtime_error("HardwareBuffers require minSdk 26 or higher!");
#endif
}

} // namespace margelo::nitro::camera
