///
/// VulkanPhysicalDeviceSelector.hpp
/// VisionCamera
/// Copyright © 2026 Marc Rousavy @ Margelo
///

#pragma once

#include "vulkan/VulkanDynamicDispatch.hpp"

#include <cstdint>
#include <limits>
#include <span>

#include <vulkan/vulkan.h>

namespace margelo::nitro::camera::resizer::vulkan {

namespace physical_device_selector {

  /**
   * Identifies the Vulkan physical device and queue family chosen for the resizer.
   */
  struct Selection final {
    VkPhysicalDevice physicalDevice{VK_NULL_HANDLE};
    uint32_t queueFamilyIndex{std::numeric_limits<uint32_t>::max()};
  };

  /**
   * Chooses the first physical device that satisfies the resizer's Vulkan requirements.
   */
  [[nodiscard]] Selection select(VkInstance instance, const VulkanInstanceDispatch& instanceDispatch, std::span<const char* const> requiredExtensions);

} // namespace physical_device_selector

} // namespace margelo::nitro::camera::resizer::vulkan
