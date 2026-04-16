///
/// HybridGPUFrame.hpp
/// VisionCamera
/// Copyright © 2026 Marc Rousavy @ Margelo
///

#pragma once

#include "HybridGPUFrameSpec.hpp"
#include "vulkan/VulkanBufferView.hpp"

#include <memory>
#include <mutex>

namespace margelo::nitro::camera::resizer {

/**
 * JS-facing wrapper around a single Vulkan-backed output buffer view, zero-copy.
 */
class HybridGPUFrame final : public HybridGPUFrameSpec {
public:
  explicit HybridGPUFrame(std::shared_ptr<vulkan::VulkanBufferView> bufferView);
  ~HybridGPUFrame() override = default;

  double getWidth() override;
  double getHeight() override;
  std::optional<ChannelOrder> getChannelOrder() override;
  std::optional<DataType> getDataType() override;
  std::optional<PixelLayout> getPixelLayout() override;
  std::shared_ptr<margelo::nitro::ArrayBuffer> getPixelBuffer() override;
  void dispose() override;
  size_t getExternalMemorySize() noexcept override;

private:
  /**
   * Copies the current buffer view reference so metadata can be queried without holding the lock.
   */
  [[nodiscard]] std::shared_ptr<vulkan::VulkanBufferView> getBufferView() const;

private:
  mutable std::mutex _bufferViewMutex;
  std::shared_ptr<vulkan::VulkanBufferView> _bufferView;
};

} // namespace margelo::nitro::camera::resizer
