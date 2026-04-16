///
/// VulkanUtils.hpp
/// VisionCamera
/// Copyright © 2026 Marc Rousavy @ Margelo
///

#pragma once

#include <cstdint>
#include <span>
#include <string>
#include <string_view>
#include <vector>

#include <vulkan/vulkan.h>

namespace margelo::nitro::camera::resizer::vulkan::utils {

/**
 * Throws a runtime_error that includes the failing VkResult for debugging.
 */
[[noreturn]] void throwVkError(VkResult result, const std::string& message);
/**
 * Validates a Vulkan call result and throws on failure.
 */
void checkVk(VkResult result, const std::string& message);
/**
 * Converts a pixel size into the number of workgroups needed to cover it.
 */
[[nodiscard]] uint32_t divideRoundUp(uint32_t value, uint32_t divisor) noexcept;
/**
 * Checks whether a required extension name exists in an enumerated extension list.
 */
[[nodiscard]] bool hasExtension(std::span<const VkExtensionProperties> extensions, std::string_view extensionName);
/**
 * Reads the available extensions from a candidate physical device.
 */
[[nodiscard]] std::vector<VkExtensionProperties> enumerateDeviceExtensions(VkPhysicalDevice physicalDevice);

} // namespace margelo::nitro::camera::resizer::vulkan::utils
