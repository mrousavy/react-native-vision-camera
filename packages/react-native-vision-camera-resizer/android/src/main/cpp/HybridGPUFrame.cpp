///
/// HybridGPUFrame.cpp
/// VisionCamera
/// Copyright © 2026 Marc Rousavy @ Margelo
///

#include "HybridGPUFrame.hpp"

#include <stdexcept>
#include <utility>

namespace margelo::nitro::camera::resizer {

HybridGPUFrame::HybridGPUFrame(std::shared_ptr<vulkan::VulkanBufferView> bufferView) : HybridObject(TAG), _bufferView(std::move(bufferView)) {
  if (_bufferView == nullptr) [[unlikely]] {
    throw std::runtime_error("GPUFrame buffer view is null.");
  }
}

double HybridGPUFrame::getWidth() {
  const std::shared_ptr<vulkan::VulkanBufferView> bufferView = getBufferView();
  if (bufferView == nullptr) {
    return 0.0;
  }
  return static_cast<double>(bufferView->getWidth());
}

double HybridGPUFrame::getHeight() {
  const std::shared_ptr<vulkan::VulkanBufferView> bufferView = getBufferView();
  if (bufferView == nullptr) {
    return 0.0;
  }
  return static_cast<double>(bufferView->getHeight());
}

std::optional<ChannelOrder> HybridGPUFrame::getChannelOrder() {
  const std::shared_ptr<vulkan::VulkanBufferView> bufferView = getBufferView();
  if (bufferView == nullptr) {
    return std::nullopt;
  }
  return bufferView->getChannelOrder();
}

std::optional<DataType> HybridGPUFrame::getDataType() {
  const std::shared_ptr<vulkan::VulkanBufferView> bufferView = getBufferView();
  if (bufferView == nullptr) {
    return std::nullopt;
  }
  return bufferView->getDataType();
}

std::optional<PixelLayout> HybridGPUFrame::getPixelLayout() {
  const std::shared_ptr<vulkan::VulkanBufferView> bufferView = getBufferView();
  if (bufferView == nullptr) {
    return std::nullopt;
  }
  return bufferView->getPixelLayout();
}

std::shared_ptr<margelo::nitro::ArrayBuffer> HybridGPUFrame::getPixelBuffer() {
  const std::shared_ptr<vulkan::VulkanBufferView> bufferView = getBufferView();
  if (bufferView == nullptr) {
    throw std::runtime_error("This GPUFrame has already been disposed.");
  }
  // Expose the mapped Vulkan output memory directly so JS can read it without an extra copy.
  return ArrayBuffer::wrap(bufferView->getData(), bufferView->getByteCount(), DeleteFn{});
}

void HybridGPUFrame::dispose() {
  // Dropping the last view reference releases the reusable output slot through RAII.
  std::lock_guard<std::mutex> lock(_bufferViewMutex);
  _bufferView = nullptr;
}

size_t HybridGPUFrame::getExternalMemorySize() noexcept {
  const std::shared_ptr<vulkan::VulkanBufferView> bufferView = getBufferView();
  return bufferView != nullptr ? bufferView->getByteCount() : 0;
}

std::shared_ptr<vulkan::VulkanBufferView> HybridGPUFrame::getBufferView() const {
  std::lock_guard<std::mutex> lock(_bufferViewMutex);
  return _bufferView;
}

} // namespace margelo::nitro::camera::resizer
