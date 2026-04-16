///
/// VulkanHardwareBufferInterop.cpp
/// VisionCamera
/// Copyright © 2026 Marc Rousavy @ Margelo
///

#include "VulkanHardwareBufferInterop.hpp"

#include "vulkan/VulkanReusableBuffer.hpp"
#include "vulkan/VulkanUtils.hpp"

#include <stdexcept>

namespace margelo::nitro::camera::resizer::vulkan {

VulkanHardwareBufferInterop::VulkanHardwareBufferInterop(VkPhysicalDevice physicalDevice, VkDevice device, const VulkanDeviceDispatch& deviceDispatch)
    : _physicalDevice(physicalDevice), _device(device), _deviceDispatch(&deviceDispatch) {}

VulkanHardwareBufferInterop::~VulkanHardwareBufferInterop() {
  clearCachedImages();
}

VulkanHardwareBufferInterop::Properties VulkanHardwareBufferInterop::queryProperties(AHardwareBuffer* hardwareBuffer) const {
  Properties properties{};
  properties.formatProperties.sType = VK_STRUCTURE_TYPE_ANDROID_HARDWARE_BUFFER_FORMAT_PROPERTIES_ANDROID;
  properties.bufferProperties.sType = VK_STRUCTURE_TYPE_ANDROID_HARDWARE_BUFFER_PROPERTIES_ANDROID;
  properties.bufferProperties.pNext = &properties.formatProperties;

  utils::checkVk(_deviceDispatch->getAndroidHardwareBufferPropertiesANDROID(_device, hardwareBuffer, &properties.bufferProperties),
                 "Failed to query Vulkan properties for the input AHardwareBuffer.");

  if (properties.bufferProperties.allocationSize == 0 || properties.bufferProperties.memoryTypeBits == 0) [[unlikely]] {
    throw std::runtime_error("Vulkan reported invalid Android HardwareBuffer allocation properties.");
  }
  if (properties.formatProperties.externalFormat == 0) [[unlikely]] {
    throw std::runtime_error("The input AHardwareBuffer does not expose an external Vulkan format.");
  }
  if ((properties.formatProperties.formatFeatures & kRequiredExternalFormatFeatures) != kRequiredExternalFormatFeatures) [[unlikely]] {
    throw std::runtime_error("The input AHardwareBuffer is not sampleable from Vulkan.");
  }
  if ((properties.formatProperties.formatFeatures & kLinearFilterFeatureMask) == 0) [[unlikely]] {
    throw std::runtime_error("The input AHardwareBuffer does not support linear-filtered Vulkan sampling.");
  }

  return properties;
}

const VulkanHardwareBufferInterop::ImportedImage& VulkanHardwareBufferInterop::importImage(AHardwareBuffer* hardwareBuffer,
                                                                                           const AHardwareBuffer_Desc& description,
                                                                                           const Properties& properties, VkSamplerYcbcrConversion conversion) {
  if (description.layers != 1) [[unlikely]] {
    throw std::runtime_error("Only single-layer AHardwareBuffers are supported by the Vulkan resizer.");
  }

  // Camera streaming tends to recycle a small set of AHardwareBuffer objects, so cache their Vulkan wrappers by
  // buffer address and reuse them across frames instead of recreating the import/image-view state every time.
  for (auto iterator = _cachedImages.begin(); iterator != _cachedImages.end();) {
    if (iterator->hardwareBuffer != hardwareBuffer) {
      // Different AHardwareBuffer* - look into next cached image...
      ++iterator;
      continue;
    }

    const bool canReuseImage = iterator->externalFormat == properties.formatProperties.externalFormat && iterator->conversion == conversion &&
                               iterator->width == description.width && iterator->height == description.height && iterator->format == description.format;
    if (canReuseImage) {
      // We can re-use this Vulkan ImportedImage because it's the same AHardwareBuffer + config as before!
      return iterator->importedImage;
    }

    // We can not re-use this Vulkan ImportedImage because the config has changed. Destroy it from cache.
    destroyImportedImage(iterator->importedImage);
    iterator = _cachedImages.erase(iterator);
  }

  // No suitable ImportedImage was found in our cache - we have to create a new one.
  CachedImage cachedImage{
      .hardwareBuffer = hardwareBuffer,
      .externalFormat = properties.formatProperties.externalFormat,
      .conversion = conversion,
      .width = description.width,
      .height = description.height,
      .format = description.format,
      .importedImage = createImportedImage(hardwareBuffer, description, properties, conversion),
  };
  _cachedImages.push_back(std::move(cachedImage));
  return _cachedImages.back().importedImage;
}

void VulkanHardwareBufferInterop::clearCachedImages() noexcept {
  for (CachedImage& cachedImage : _cachedImages) {
    destroyImportedImage(cachedImage.importedImage);
  }
  _cachedImages.clear();
}

VulkanHardwareBufferInterop::ImportedImage VulkanHardwareBufferInterop::createImportedImage(AHardwareBuffer* hardwareBuffer,
                                                                                            const AHardwareBuffer_Desc& description,
                                                                                            const Properties& properties,
                                                                                            VkSamplerYcbcrConversion conversion) const {
  ImportedImage image{};

  try {
    // Create temporary Vulkan wrappers around the caller-owned camera buffer so the shader can sample it.
    VkExternalMemoryImageCreateInfo externalMemoryImageCreateInfo{
        .sType = VK_STRUCTURE_TYPE_EXTERNAL_MEMORY_IMAGE_CREATE_INFO,
        .pNext = nullptr,
        .handleTypes = VK_EXTERNAL_MEMORY_HANDLE_TYPE_ANDROID_HARDWARE_BUFFER_BIT_ANDROID,
    };

    VkExternalFormatANDROID externalFormatInfo{
        .sType = VK_STRUCTURE_TYPE_EXTERNAL_FORMAT_ANDROID,
        .pNext = &externalMemoryImageCreateInfo,
        .externalFormat = properties.formatProperties.externalFormat,
    };

    VkImageCreateInfo imageCreateInfo{
        .sType = VK_STRUCTURE_TYPE_IMAGE_CREATE_INFO,
        .pNext = &externalFormatInfo,
        .flags = 0,
        .imageType = VK_IMAGE_TYPE_2D,
        .format = VK_FORMAT_UNDEFINED,
        .extent =
            {
                .width = description.width,
                .height = description.height,
                .depth = 1,
            },
        .mipLevels = 1,
        .arrayLayers = 1,
        .samples = VK_SAMPLE_COUNT_1_BIT,
        .tiling = VK_IMAGE_TILING_OPTIMAL,
        .usage = VK_IMAGE_USAGE_SAMPLED_BIT,
        .sharingMode = VK_SHARING_MODE_EXCLUSIVE,
        .queueFamilyIndexCount = 0,
        .pQueueFamilyIndices = nullptr,
        .initialLayout = VK_IMAGE_LAYOUT_UNDEFINED,
    };

    utils::checkVk(vkCreateImage(_device, &imageCreateInfo, nullptr, &image.image),
                   "Failed to create the imported Vulkan image for the input AHardwareBuffer.");

    const uint32_t memoryTypeIndex = VulkanReusableBuffer::findMemoryTypeIndex(_physicalDevice, properties.bufferProperties.memoryTypeBits, 0, 0);

    VkImportAndroidHardwareBufferInfoANDROID importInfo{
        .sType = VK_STRUCTURE_TYPE_IMPORT_ANDROID_HARDWARE_BUFFER_INFO_ANDROID,
        .pNext = nullptr,
        .buffer = hardwareBuffer,
    };

    VkMemoryDedicatedAllocateInfo dedicatedAllocateInfo{
        .sType = VK_STRUCTURE_TYPE_MEMORY_DEDICATED_ALLOCATE_INFO,
        .pNext = &importInfo,
        .image = image.image,
        .buffer = VK_NULL_HANDLE,
    };

    VkMemoryAllocateInfo memoryAllocateInfo{
        .sType = VK_STRUCTURE_TYPE_MEMORY_ALLOCATE_INFO,
        .pNext = &dedicatedAllocateInfo,
        .allocationSize = properties.bufferProperties.allocationSize,
        .memoryTypeIndex = memoryTypeIndex,
    };

    utils::checkVk(vkAllocateMemory(_device, &memoryAllocateInfo, nullptr, &image.memory),
                   "Failed to allocate Vulkan memory for the imported AHardwareBuffer image.");
    utils::checkVk(vkBindImageMemory(_device, image.image, image.memory, 0), "Failed to bind Vulkan memory to the imported AHardwareBuffer image.");

    VkSamplerYcbcrConversionInfo conversionInfo{
        .sType = VK_STRUCTURE_TYPE_SAMPLER_YCBCR_CONVERSION_INFO,
        .pNext = nullptr,
        .conversion = conversion,
    };

    VkImageViewCreateInfo imageViewCreateInfo{};
    imageViewCreateInfo.sType = VK_STRUCTURE_TYPE_IMAGE_VIEW_CREATE_INFO;
    imageViewCreateInfo.pNext = &conversionInfo;
    imageViewCreateInfo.image = image.image;
    imageViewCreateInfo.viewType = VK_IMAGE_VIEW_TYPE_2D;
    imageViewCreateInfo.format = VK_FORMAT_UNDEFINED;
    imageViewCreateInfo.components = {
        VK_COMPONENT_SWIZZLE_IDENTITY,
        VK_COMPONENT_SWIZZLE_IDENTITY,
        VK_COMPONENT_SWIZZLE_IDENTITY,
        VK_COMPONENT_SWIZZLE_IDENTITY,
    };
    imageViewCreateInfo.subresourceRange.aspectMask = VK_IMAGE_ASPECT_COLOR_BIT;
    imageViewCreateInfo.subresourceRange.baseMipLevel = 0;
    imageViewCreateInfo.subresourceRange.levelCount = 1;
    imageViewCreateInfo.subresourceRange.baseArrayLayer = 0;
    imageViewCreateInfo.subresourceRange.layerCount = 1;

    utils::checkVk(vkCreateImageView(_device, &imageViewCreateInfo, nullptr, &image.view),
                   "Failed to create a Vulkan image view for the imported AHardwareBuffer image.");

    return image;
  } catch (...) {
    destroyImportedImage(image);
    throw;
  }
}

void VulkanHardwareBufferInterop::destroyImportedImage(ImportedImage& image) const noexcept {
  if (_device == VK_NULL_HANDLE) {
    // The device is already destroyed, so there is nothing left to free here.
    image = ImportedImage{};
    return;
  }

  if (image.view != VK_NULL_HANDLE) {
    vkDestroyImageView(_device, image.view, nullptr);
  }
  if (image.image != VK_NULL_HANDLE) {
    vkDestroyImage(_device, image.image, nullptr);
  }
  if (image.memory != VK_NULL_HANDLE) {
    vkFreeMemory(_device, image.memory, nullptr);
  }
  image = ImportedImage{};
}

} // namespace margelo::nitro::camera::resizer::vulkan
