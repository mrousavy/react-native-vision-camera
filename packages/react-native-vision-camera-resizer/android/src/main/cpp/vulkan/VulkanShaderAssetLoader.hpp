///
/// VulkanShaderAssetLoader.hpp
/// VisionCamera
/// Copyright © 2026 Marc Rousavy @ Margelo
///

#pragma once

#include <cstdint>
#include <vector>

namespace margelo::nitro::camera::resizer::vulkan {

/**
 * Loads and caches the precompiled resizer compute shader from Android assets.
 *
 * @throws std::runtime_error If the packaged shader asset is missing or invalid.
 */
[[nodiscard]] const std::vector<uint32_t>& getResizerComputeShaderSpirv();

} // namespace margelo::nitro::camera::resizer::vulkan
