///
/// VulkanReusableBuffer.hpp
/// VisionCamera
/// Copyright © 2026 Marc Rousavy @ Margelo
///

#pragma once

#include "ChannelOrder.hpp"
#include "DataType.hpp"
#include "PixelLayout.hpp"
#include "vulkan/VulkanBufferView.hpp"

#include <cstddef>
#include <cstdint>
#include <memory>
#include <mutex>

#include <vulkan/vulkan.h>

namespace margelo::nitro::camera::resizer::vulkan {

/**
 * Owns the persistent Vulkan output allocation and enforces that only one live buffer view can hold it at a time.
 */
class VulkanReusableBuffer final {
public:
  /**
   * Allocates and maps one host-visible Vulkan storage buffer for the resizer output.
   */
  VulkanReusableBuffer(VkPhysicalDevice physicalDevice, VkDevice device, size_t bufferSize);
  ~VulkanReusableBuffer();

  VulkanReusableBuffer(const VulkanReusableBuffer&) = delete;
  VulkanReusableBuffer& operator=(const VulkanReusableBuffer&) = delete;

  /**
   * Returns one live view over the reusable Vulkan output allocation.
   */
  [[nodiscard]] std::shared_ptr<VulkanBufferView> acquireView(uint32_t width, uint32_t height, ChannelOrder channelOrder, DataType dataType,
                                                              PixelLayout pixelLayout, size_t byteCount);
  /**
   * Finds a compatible Vulkan memory type for the reusable output allocation or imported hardware buffers.
   */
  [[nodiscard]] static uint32_t findMemoryTypeIndex(VkPhysicalDevice physicalDevice, uint32_t memoryTypeBits, VkMemoryPropertyFlags requiredFlags,
                                                    VkMemoryPropertyFlags preferredFlags);
  /**
   * Reports whether the reusable output allocation is currently checked out by a live GPU frame.
   */
  [[nodiscard]] bool isInUse() const noexcept;
  [[nodiscard]] VkBuffer getBuffer() const noexcept;
  [[nodiscard]] VkDeviceMemory getMemory() const noexcept;
  [[nodiscard]] uint8_t* getMappedData() const noexcept;
  [[nodiscard]] size_t getAllocationSize() const noexcept;
  [[nodiscard]] bool isHostCoherent() const noexcept;

private:
  void releaseView() noexcept;

private:
  mutable std::mutex _stateMutex;
  VkDevice _device{VK_NULL_HANDLE};
  VkBuffer _buffer{VK_NULL_HANDLE};
  VkDeviceMemory _memory{VK_NULL_HANDLE};
  uint8_t* _mappedData{nullptr};
  size_t _allocationSize{0};
  bool _isHostCoherent{false};
  bool _isInUse{false};
};

} // namespace margelo::nitro::camera::resizer::vulkan
