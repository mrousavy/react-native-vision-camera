///
/// VulkanBufferView.hpp
/// VisionCamera
/// Copyright © 2026 Marc Rousavy @ Margelo
///

#pragma once

#include "ChannelOrder.hpp"
#include "DataType.hpp"
#include "PixelLayout.hpp"
#include <cstddef>
#include <cstdint>
#include <functional>

namespace margelo::nitro::camera::resizer::vulkan {

/**
 * Exposes one zero-copy view over the mapped Vulkan output buffer.
 */
class VulkanBufferView final {
public:
  /**
   * Wraps the mapped output memory and the callback that releases the reusable output slot.
   */
  VulkanBufferView(uint32_t width, uint32_t height, ChannelOrder channelOrder, DataType dataType, PixelLayout pixelLayout, uint8_t* data, size_t byteCount,
                   std::function<void()>&& onRelease);
  ~VulkanBufferView();

  VulkanBufferView(const VulkanBufferView&) = delete;
  VulkanBufferView& operator=(const VulkanBufferView&) = delete;

  [[nodiscard]] uint32_t getWidth() const noexcept;
  [[nodiscard]] uint32_t getHeight() const noexcept;
  [[nodiscard]] ChannelOrder getChannelOrder() const noexcept;
  [[nodiscard]] DataType getDataType() const noexcept;
  [[nodiscard]] PixelLayout getPixelLayout() const noexcept;
  [[nodiscard]] uint8_t* getData() const noexcept;
  [[nodiscard]] size_t getByteCount() const noexcept;

private:
  const uint32_t _width;
  const uint32_t _height;
  const ChannelOrder _channelOrder;
  const DataType _dataType;
  const PixelLayout _pixelLayout;
  uint8_t* const _data;
  const size_t _byteCount;
  std::function<void()> _onRelease;
};

} // namespace margelo::nitro::camera::resizer::vulkan
