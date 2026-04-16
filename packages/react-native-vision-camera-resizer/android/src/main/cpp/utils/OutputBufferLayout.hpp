///
/// OutputBufferLayout.hpp
/// VisionCamera
/// Copyright © 2026 Marc Rousavy @ Margelo
///

#pragma once

#include "ChannelOrder.hpp"
#include "DataType.hpp"
#include <cstddef>
#include <cstdint>

namespace margelo::nitro::camera::resizer::utils {

/**
 * Returns the number of packed output channels written for each pixel in this output layout.
 */
[[nodiscard]] uint32_t getChannelsPerPixel(ChannelOrder channelOrder);

/**
 * Returns the number of bytes written for each output channel.
 */
[[nodiscard]] uint32_t getBytesPerChannel(DataType dataType);
/**
 * Returns the exact byte count for one tightly packed output image.
 */
[[nodiscard]] size_t getOutputTotalByteCount(ChannelOrder channelOrder, DataType dataType, uint32_t width, uint32_t height);

} // namespace margelo::nitro::camera::resizer::utils
