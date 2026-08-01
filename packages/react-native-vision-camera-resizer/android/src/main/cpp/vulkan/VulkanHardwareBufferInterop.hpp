///
/// VulkanHardwareBufferInterop.hpp
/// VisionCamera
/// Copyright © 2026 Marc Rousavy @ Margelo
///

#pragma once

#include "vulkan/VulkanDynamicDispatch.hpp"

#include <android/hardware_buffer.h>

#include <list>

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

  /**
   * Upper bound on cached imported images (LRU-evicted).
   *
   * Importing an AHardwareBuffer into Vulkan ACQUIRES A REFERENCE on it (per the
   * VK_ANDROID_external_memory_android_hardware_buffer spec), so every cached entry pins a full camera buffer
   * alive. Unbounded, that means the Resizer pins every AHardwareBuffer it has ever seen for its whole lifetime:
   * each camera session restart (fps/constraints change, pause/resume, ...) makes CameraX allocate a fresh buffer
   * set, so the pinned set grows by a whole set per restart and is never released.
   *
   * A single streaming session's working set is small (ImageAnalysis with maxImages=4 cycles through ~4-6
   * buffers), so 12 leaves generous slack while still converging onto the CURRENT session's buffers within a few
   * frames of a restart. The cache is a pure optimization - the pipeline submits and waits synchronously in
   * `run(..)`, so a miss only costs one import.
   */
  static inline constexpr size_t kMaxCachedImages = 12;

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
  // `std::list`, not `std::vector`: `importImage(..)` hands out a reference INTO this container, and the LRU now
  // reorders on every hit and evicts on misses. List nodes have stable addresses, so `splice(..)`-to-front and
  // `pop_back()` provably never move the entry being returned. Front = most recently used.
  std::list<CachedImage> _cachedImages{};
};

} // namespace margelo::nitro::camera::resizer::vulkan
