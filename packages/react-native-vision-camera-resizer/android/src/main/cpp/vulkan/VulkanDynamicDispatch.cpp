///
/// VulkanDynamicDispatch.cpp
/// VisionCamera
/// Copyright © 2026 Marc Rousavy @ Margelo
///

#include "VulkanDynamicDispatch.hpp"

#include <stdexcept>
#include <string>

namespace margelo::nitro::camera::resizer::vulkan {

namespace {

  template <typename Proc>
  [[nodiscard]] Proc loadInstanceProc(VkInstance instance, const char* functionName) {
    // These entry points are missing from the API 26 NDK stubs, so resolve them from the runtime loader instead.
    const Proc proc = reinterpret_cast<Proc>(vkGetInstanceProcAddr(instance, functionName));
    if (proc == nullptr) [[unlikely]] {
      throw std::runtime_error(std::string("Failed to load Vulkan instance function `") + functionName + "`.");
    }
    return proc;
  }

  template <typename Proc>
  [[nodiscard]] Proc loadDeviceProc(VkDevice device, const char* functionName) {
    const Proc proc = reinterpret_cast<Proc>(vkGetDeviceProcAddr(device, functionName));
    if (proc == nullptr) [[unlikely]] {
      throw std::runtime_error(std::string("Failed to load Vulkan device function `") + functionName + "`.");
    }
    return proc;
  }

} // namespace

VulkanInstanceDispatch VulkanInstanceDispatch::load(VkInstance instance) {
  VulkanInstanceDispatch dispatch{};
  dispatch.getPhysicalDeviceFeatures2 = loadInstanceProc<PFN_vkGetPhysicalDeviceFeatures2>(instance, "vkGetPhysicalDeviceFeatures2");
  return dispatch;
}

VulkanDeviceDispatch VulkanDeviceDispatch::load(VkDevice device) {
  VulkanDeviceDispatch dispatch{};
  dispatch.getAndroidHardwareBufferPropertiesANDROID =
      loadDeviceProc<PFN_vkGetAndroidHardwareBufferPropertiesANDROID>(device, "vkGetAndroidHardwareBufferPropertiesANDROID");
  dispatch.createSamplerYcbcrConversion = loadDeviceProc<PFN_vkCreateSamplerYcbcrConversion>(device, "vkCreateSamplerYcbcrConversion");
  dispatch.destroySamplerYcbcrConversion = loadDeviceProc<PFN_vkDestroySamplerYcbcrConversion>(device, "vkDestroySamplerYcbcrConversion");
  return dispatch;
}

} // namespace margelo::nitro::camera::resizer::vulkan
