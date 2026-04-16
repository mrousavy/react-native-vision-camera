///
/// HybridResizerFactory.cpp
/// VisionCamera
/// Copyright © 2026 Marc Rousavy @ Margelo
///

#include "HybridResizerFactory.hpp"

#include "vulkan/VulkanResizerPipeline.hpp"

namespace margelo::nitro::camera::resizer {

HybridResizerFactory::HybridResizerFactory() : HybridObject(TAG) {}

bool HybridResizerFactory::isAvailable() {
  return vulkan::VulkanResizerPipeline::isSupported();
}

std::shared_ptr<Promise<std::shared_ptr<HybridResizerSpec>>> HybridResizerFactory::createResizer(const ResizerOptions& options) {
  return Promise<std::shared_ptr<HybridResizerSpec>>::async([=]() {
    // Create `HybridResizer` on a separate C++ Thread (pooled),
    // so that the Vulkan setup doesn't block the main JS Thread.
    return std::make_shared<HybridResizer>(options);
  });
}

} // namespace margelo::nitro::camera::resizer
