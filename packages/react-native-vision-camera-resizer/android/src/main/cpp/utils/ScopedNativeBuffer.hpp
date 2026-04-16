///
/// ScopedNativeBuffer.hpp
/// VisionCamera
/// Copyright © 2026 Marc Rousavy @ Margelo
///

#pragma once

#include <VisionCamera/NativeBuffer.hpp>
#include <android/hardware_buffer.h>
#include <utility>

namespace margelo::nitro::camera::resizer {

/**
 * Keeps a Frame `NativeBuffer` alive via RAII while
 * native code borrows its `AHardwareBuffer` pointer.
 */
class ScopedNativeBuffer final {
public:
  explicit ScopedNativeBuffer(camera::NativeBuffer nativeBuffer) : _nativeBuffer(std::move(nativeBuffer)) {}
  ScopedNativeBuffer(const ScopedNativeBuffer&) = delete;
  ScopedNativeBuffer(ScopedNativeBuffer&&) = delete;

  ~ScopedNativeBuffer() {
    try {
      _nativeBuffer.release();
    } catch (...) {
      // Avoid throwing from a destructor.
    }
  }

  /**
   * Returns the borrowed `AHardwareBuffer` pointer
   * owned by the wrapped `NativeBuffer`.
   */
  AHardwareBuffer* getHardwareBuffer() const noexcept {
    return reinterpret_cast<AHardwareBuffer*>(_nativeBuffer.pointer);
  }

private:
  camera::NativeBuffer _nativeBuffer;
};

} // namespace margelo::nitro::camera::resizer
