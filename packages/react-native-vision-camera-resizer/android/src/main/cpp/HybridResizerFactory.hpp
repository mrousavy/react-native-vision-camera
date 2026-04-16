///
/// HybridResizerFactory.hpp
/// VisionCamera
/// Copyright © 2026 Marc Rousavy @ Margelo
///

#pragma once

#include "HybridResizer.hpp"
#include "HybridResizerFactorySpec.hpp"

namespace margelo::nitro::camera::resizer {

class HybridResizerFactory : public HybridResizerFactorySpec {
public:
  HybridResizerFactory();

  bool isAvailable() override;
  std::shared_ptr<Promise<std::shared_ptr<HybridResizerSpec>>> createResizer(const ResizerOptions& options) override;
};

} // namespace margelo::nitro::camera::resizer
