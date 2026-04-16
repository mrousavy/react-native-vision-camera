///
/// VulkanHardwareBufferInterop.hpp
/// VisionCamera
/// Copyright © 2026 Marc Rousavy @ Margelo
///

#pragma once

#include "vulkan/VulkanDynamicDispatch.hpp"

#include <android/hardware_buffer.h>

#include <vector>

#include <vulkan/vulkan.h>
#include <vulkan/vulkan_android.h>

namespace margelo::nitro::camera::resizer::vulkan {

/**
 * Owns the Vulkan-side Android HardwareBuffer import helpers used by the resizer pipeline.
 * Internally it caches imported image wrappers by AHardwareBuffer* address so camera frames can reuse them across
 * realtime dispatches instead of recreating the Vulkan import objects every frame.
 */
class VulkanHardwareBufferInterop final {
public:
  /**
   * Bundles the Vulkan metadata queried from an Android hardware buffer.
   */
  struct Properties final {
    VkAndroidHardwareBufferPropertiesANDROID bufferProperties{};
    VkAndroidHardwareBufferFormatPropertiesANDROID formatProperties{};
  };

  /**
   * Temporary Vulkan objects that alias one imported AHardwareBuffer for a single dispatch.
   */
  struct ImportedImage final {
    VkImage image{VK_NULL_HANDLE};
    VkDeviceMemory memory{VK_NULL_HANDLE};
    VkImageView view{VK_NULL_HANDLE};
  };

  VulkanHardwareBufferInterop(VkPhysicalDevice physicalDevice, VkDevice device, const VulkanDeviceDispatch& deviceDispatch);
  ~VulkanHardwareBufferInterop();

  /**
   * Queries the Vulkan import and sampling properties of the current hardware buffer.
   */
  [[nodiscard]] Properties queryProperties(AHardwareBuffer* hardwareBuffer) const;
  /**
   * Imports one sampled image wrapper for the current hardware buffer.
   * Internally this reuses cached Vulkan import objects keyed by AHardwareBuffer* address for streaming camera input.
   */
  [[nodiscard]] const ImportedImage& importImage(AHardwareBuffer* hardwareBuffer, const AHardwareBuffer_Desc& description, const Properties& properties,
                                                 VkSamplerYcbcrConversion conversion);
  /**
   * Destroys every cached imported-image wrapper.
   */
  void clearCachedImages() noexcept;

private:
  struct CachedImage final {
    AHardwareBuffer* hardwareBuffer{nullptr};
    uint64_t externalFormat{0};
    VkSamplerYcbcrConversion conversion{VK_NULL_HANDLE};
    uint32_t width{0};
    uint32_t height{0};
    uint32_t format{0};
    ImportedImage importedImage{};
  };

  static inline constexpr VkFormatFeatureFlags kRequiredExternalFormatFeatures = VK_FORMAT_FEATURE_SAMPLED_IMAGE_BIT;
  static inline constexpr VkFormatFeatureFlags kLinearFilterFeatureMask =
      VK_FORMAT_FEATURE_SAMPLED_IMAGE_FILTER_LINEAR_BIT | VK_FORMAT_FEATURE_SAMPLED_IMAGE_YCBCR_CONVERSION_LINEAR_FILTER_BIT;

  [[nodiscard]] ImportedImage createImportedImage(AHardwareBuffer* hardwareBuffer, const AHardwareBuffer_Desc& description, const Properties& properties,
                                                  VkSamplerYcbcrConversion conversion) const;
  void destroyImportedImage(ImportedImage& image) const noexcept;

private:
  VkPhysicalDevice _physicalDevice{VK_NULL_HANDLE};
  VkDevice _device{VK_NULL_HANDLE};
  const VulkanDeviceDispatch* _deviceDispatch{nullptr};
  std::vector<CachedImage> _cachedImages{};
};

} // namespace margelo::nitro::camera::resizer::vulkan
