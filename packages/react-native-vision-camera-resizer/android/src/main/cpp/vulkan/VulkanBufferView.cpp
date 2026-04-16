///
/// VulkanBufferView.cpp
/// VisionCamera
/// Copyright © 2026 Marc Rousavy @ Margelo
///

#include "VulkanBufferView.hpp"

#include <utility>

namespace margelo::nitro::camera::resizer::vulkan {

VulkanBufferView::VulkanBufferView(uint32_t width, uint32_t height, ChannelOrder channelOrder, DataType dataType, PixelLayout pixelLayout, uint8_t* data,
                                   size_t byteCount, std::function<void()>&& onRelease)
    : _width(width), _height(height), _channelOrder(channelOrder), _dataType(dataType), _pixelLayout(pixelLayout), _data(data), _byteCount(byteCount),
      _onRelease(std::move(onRelease)) {}

VulkanBufferView::~VulkanBufferView() {
  if (_onRelease != nullptr) {
    _onRelease();
    _onRelease = nullptr;
  }
}

uint32_t VulkanBufferView::getWidth() const noexcept {
  return _width;
}

uint32_t VulkanBufferView::getHeight() const noexcept {
  return _height;
}

ChannelOrder VulkanBufferView::getChannelOrder() const noexcept {
  return _channelOrder;
}

DataType VulkanBufferView::getDataType() const noexcept {
  return _dataType;
}

PixelLayout VulkanBufferView::getPixelLayout() const noexcept {
  return _pixelLayout;
}

uint8_t* VulkanBufferView::getData() const noexcept {
  return _data;
}

size_t VulkanBufferView::getByteCount() const noexcept {
  return _byteCount;
}

} // namespace margelo::nitro::camera::resizer::vulkan
