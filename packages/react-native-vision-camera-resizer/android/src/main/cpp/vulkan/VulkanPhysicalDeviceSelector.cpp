///
/// VulkanPhysicalDeviceSelector.cpp
/// VisionCamera
/// Copyright © 2026 Marc Rousavy @ Margelo
///

#include "VulkanPhysicalDeviceSelector.hpp"

#include "vulkan/VulkanUtils.hpp"

#include <optional>
#include <stdexcept>
#include <vector>

namespace margelo::nitro::camera::resizer::vulkan {

namespace physical_device_selector {

  namespace {

    [[nodiscard]] std::optional<Selection> trySelect(VkPhysicalDevice physicalDevice, const VulkanInstanceDispatch& instanceDispatch,
                                                     std::span<const char* const> requiredExtensions) {
      VkPhysicalDeviceProperties properties{};
      vkGetPhysicalDeviceProperties(physicalDevice, &properties);
      if (VK_VERSION_MAJOR(properties.apiVersion) < 1 || (VK_VERSION_MAJOR(properties.apiVersion) == 1 && VK_VERSION_MINOR(properties.apiVersion) < 1)) {
        return std::nullopt;
      }

      const std::vector<VkExtensionProperties> extensions = utils::enumerateDeviceExtensions(physicalDevice);
      for (const char* extensionName : requiredExtensions) {
        if (!utils::hasExtension(extensions, extensionName)) {
          return std::nullopt;
        }
      }

      uint32_t queueFamilyCount = 0;
      vkGetPhysicalDeviceQueueFamilyProperties(physicalDevice, &queueFamilyCount, nullptr);
      std::vector<VkQueueFamilyProperties> queueFamilies(queueFamilyCount);
      vkGetPhysicalDeviceQueueFamilyProperties(physicalDevice, &queueFamilyCount, queueFamilies.data());

      std::optional<uint32_t> queueFamilyIndex;
      for (uint32_t index = 0; index < queueFamilyCount; index++) {
        if ((queueFamilies[index].queueFlags & VK_QUEUE_COMPUTE_BIT) != 0) {
          queueFamilyIndex = index;
          break;
        }
      }
      if (!queueFamilyIndex.has_value()) {
        return std::nullopt;
      }

      VkPhysicalDeviceVulkan11Features vulkan11Features{};
      vulkan11Features.sType = VK_STRUCTURE_TYPE_PHYSICAL_DEVICE_VULKAN_1_1_FEATURES;

      VkPhysicalDeviceFeatures2 features2{
          .sType = VK_STRUCTURE_TYPE_PHYSICAL_DEVICE_FEATURES_2,
          .pNext = &vulkan11Features,
          .features = {},
      };
      instanceDispatch.getPhysicalDeviceFeatures2(physicalDevice, &features2);

      if (vulkan11Features.samplerYcbcrConversion != VK_TRUE) {
        return std::nullopt;
      }

      return Selection{physicalDevice, queueFamilyIndex.value()};
    }

  } // namespace

  Selection select(VkInstance instance, const VulkanInstanceDispatch& instanceDispatch, std::span<const char* const> requiredExtensions) {
    uint32_t physicalDeviceCount = 0;
    utils::checkVk(vkEnumeratePhysicalDevices(instance, &physicalDeviceCount, nullptr), "Failed to enumerate Vulkan physical devices.");
    if (physicalDeviceCount == 0) [[unlikely]] {
      throw std::runtime_error("This device does not expose any Vulkan physical devices.");
    }

    std::vector<VkPhysicalDevice> physicalDevices(physicalDeviceCount);
    utils::checkVk(vkEnumeratePhysicalDevices(instance, &physicalDeviceCount, physicalDevices.data()), "Failed to read Vulkan physical device list.");

    for (const VkPhysicalDevice physicalDevice : physicalDevices) {
      const std::optional<Selection> selection = trySelect(physicalDevice, instanceDispatch, requiredExtensions);
      if (selection.has_value()) {
        return selection.value();
      }
    }

    throw std::runtime_error("Failed to find a Vulkan 1.1 device with sampler YCbCr conversion and Android HardwareBuffer import support.");
  }

} // namespace physical_device_selector

} // namespace margelo::nitro::camera::resizer::vulkan
