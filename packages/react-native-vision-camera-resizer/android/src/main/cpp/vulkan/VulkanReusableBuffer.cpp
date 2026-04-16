///
/// VulkanReusableBuffer.cpp
/// VisionCamera
/// Copyright © 2026 Marc Rousavy @ Margelo
///

#include "VulkanReusableBuffer.hpp"

#include <optional>
#include <stdexcept>

namespace margelo::nitro::camera::resizer::vulkan {

uint32_t VulkanReusableBuffer::findMemoryTypeIndex(VkPhysicalDevice physicalDevice, uint32_t memoryTypeBits, VkMemoryPropertyFlags requiredFlags,
                                                   VkMemoryPropertyFlags preferredFlags) {
  VkPhysicalDeviceMemoryProperties memoryProperties{};
  vkGetPhysicalDeviceMemoryProperties(physicalDevice, &memoryProperties);

  std::optional<uint32_t> fallbackMatch;
  for (uint32_t index = 0; index < memoryProperties.memoryTypeCount; index++) {
    // Vulkan exposes legal memory-type indices as a bitmask. Skip every index that this allocation cannot use.
    const uint32_t bit = 1u << index;
    if ((memoryTypeBits & bit) == 0) {
      continue;
    }

    const VkMemoryPropertyFlags flags = memoryProperties.memoryTypes[index].propertyFlags;
    // Required flags must match exactly, otherwise this memory type cannot back the allocation at all.
    if ((flags & requiredFlags) != requiredFlags) {
      continue;
    }
    // Preferred flags are best-effort. Return immediately if this index satisfies both required and preferred flags.
    if ((flags & preferredFlags) == preferredFlags) {
      return index;
    }
    // Keep the first required-only match as a fallback in case no preferred match exists.
    if (!fallbackMatch.has_value()) {
      fallbackMatch = index;
    }
  }

  if (fallbackMatch.has_value()) {
    return fallbackMatch.value();
  }

  throw std::runtime_error("Failed to find a compatible Vulkan memory type for the output buffer.");
}

VulkanReusableBuffer::VulkanReusableBuffer(VkPhysicalDevice physicalDevice, VkDevice device, size_t bufferSize) : _device(device) {
  VkBufferCreateInfo bufferCreateInfo{
      .sType = VK_STRUCTURE_TYPE_BUFFER_CREATE_INFO,
      .pNext = nullptr,
      .flags = 0,
      .size = bufferSize,
      .usage = VK_BUFFER_USAGE_STORAGE_BUFFER_BIT | VK_BUFFER_USAGE_TRANSFER_DST_BIT,
      .sharingMode = VK_SHARING_MODE_EXCLUSIVE,
      .queueFamilyIndexCount = 0,
      .pQueueFamilyIndices = nullptr,
  };

  if (vkCreateBuffer(_device, &bufferCreateInfo, nullptr, &_buffer) != VK_SUCCESS) [[unlikely]] {
    throw std::runtime_error("Failed to create the Vulkan resizer output buffer.");
  }

  try {
    VkMemoryRequirements memoryRequirements{};
    vkGetBufferMemoryRequirements(_device, _buffer, &memoryRequirements);

    const uint32_t memoryTypeIndex = findMemoryTypeIndex(physicalDevice, memoryRequirements.memoryTypeBits, VK_MEMORY_PROPERTY_HOST_VISIBLE_BIT,
                                                         VK_MEMORY_PROPERTY_HOST_COHERENT_BIT | VK_MEMORY_PROPERTY_HOST_CACHED_BIT);

    VkPhysicalDeviceMemoryProperties memoryProperties{};
    vkGetPhysicalDeviceMemoryProperties(physicalDevice, &memoryProperties);

    VkMemoryAllocateInfo memoryAllocateInfo{
        .sType = VK_STRUCTURE_TYPE_MEMORY_ALLOCATE_INFO,
        .pNext = nullptr,
        .allocationSize = memoryRequirements.size,
        .memoryTypeIndex = memoryTypeIndex,
    };

    if (vkAllocateMemory(_device, &memoryAllocateInfo, nullptr, &_memory) != VK_SUCCESS) [[unlikely]] {
      throw std::runtime_error("Failed to allocate Vulkan memory for the resizer output buffer.");
    }
    if (vkBindBufferMemory(_device, _buffer, _memory, 0) != VK_SUCCESS) [[unlikely]] {
      throw std::runtime_error("Failed to bind Vulkan memory to the resizer output buffer.");
    }

    void* mappedData = nullptr;
    if (vkMapMemory(_device, _memory, 0, memoryRequirements.size, 0, &mappedData) != VK_SUCCESS) [[unlikely]] {
      throw std::runtime_error("Failed to map the Vulkan resizer output buffer.");
    }

    _mappedData = static_cast<uint8_t*>(mappedData);
    _allocationSize = memoryRequirements.size;
    _isHostCoherent = (memoryProperties.memoryTypes[memoryTypeIndex].propertyFlags & VK_MEMORY_PROPERTY_HOST_COHERENT_BIT) != 0;
  } catch (...) {
    if (_mappedData != nullptr) {
      vkUnmapMemory(_device, _memory);
      _mappedData = nullptr;
    }
    if (_memory != VK_NULL_HANDLE) {
      vkFreeMemory(_device, _memory, nullptr);
      _memory = VK_NULL_HANDLE;
    }
    if (_buffer != VK_NULL_HANDLE) {
      vkDestroyBuffer(_device, _buffer, nullptr);
      _buffer = VK_NULL_HANDLE;
    }
    throw;
  }
}

VulkanReusableBuffer::~VulkanReusableBuffer() {
  if (_device == VK_NULL_HANDLE) {
    // The device is already gone, so there is nothing left to free through Vulkan.
    return;
  }

  if (_mappedData != nullptr) {
    vkUnmapMemory(_device, _memory);
    _mappedData = nullptr;
  }
  if (_buffer != VK_NULL_HANDLE) {
    vkDestroyBuffer(_device, _buffer, nullptr);
    _buffer = VK_NULL_HANDLE;
  }
  if (_memory != VK_NULL_HANDLE) {
    vkFreeMemory(_device, _memory, nullptr);
    _memory = VK_NULL_HANDLE;
  }
  _allocationSize = 0;
  _isHostCoherent = false;
}

std::shared_ptr<VulkanBufferView> VulkanReusableBuffer::acquireView(uint32_t width, uint32_t height, ChannelOrder channelOrder, DataType dataType,
                                                                    PixelLayout pixelLayout, size_t byteCount) {
  std::lock_guard<std::mutex> lock(_stateMutex);
  if (_isInUse) [[unlikely]] {
    throw std::runtime_error("Previous GPUFrame is still active. Dispose it before calling resize() again.");
  }

  _isInUse = true;
  return std::make_shared<VulkanBufferView>(width, height, channelOrder, dataType, pixelLayout, _mappedData, byteCount, [this]() { releaseView(); });
}

bool VulkanReusableBuffer::isInUse() const noexcept {
  std::lock_guard<std::mutex> lock(_stateMutex);
  return _isInUse;
}

VkBuffer VulkanReusableBuffer::getBuffer() const noexcept {
  return _buffer;
}

VkDeviceMemory VulkanReusableBuffer::getMemory() const noexcept {
  return _memory;
}

uint8_t* VulkanReusableBuffer::getMappedData() const noexcept {
  return _mappedData;
}

size_t VulkanReusableBuffer::getAllocationSize() const noexcept {
  return _allocationSize;
}

bool VulkanReusableBuffer::isHostCoherent() const noexcept {
  return _isHostCoherent;
}

void VulkanReusableBuffer::releaseView() noexcept {
  std::lock_guard<std::mutex> lock(_stateMutex);
  _isInUse = false;
}

} // namespace margelo::nitro::camera::resizer::vulkan
