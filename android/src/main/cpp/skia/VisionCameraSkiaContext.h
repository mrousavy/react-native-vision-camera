//
// Created by Marc Rousavy on 31.08.23.
//

#pragma once

#include <jsi/jsi.h>
#include <RNSkPlatformContext.h>

namespace vision {

using namespace facebook;

class VisionCameraSkiaContext: public RNSkia::RNSkPlatformContext {
 public:
  VisionCameraSkiaContext(jsi::Runtime* runtime,
                          std::shared_ptr<react::CallInvoker> callInvoker,
                          float pixelDensity)
                          : RNSkia::RNSkPlatformContext(runtime, callInvoker, pixelDensity) { }

  void raiseError(const std::exception &err) override {
    throw std::runtime_error("VisionCameraSkiaContext Error: " + std::string(err.what()));
  }

  void performStreamOperation(
      const std::string &sourceUri,
      const std::function<void(std::unique_ptr<SkStreamAsset>)> &op) override {
    throw std::runtime_error("VisionCameraSkiaContext::performStreamOperation is not yet implemented!");
  }

  sk_sp<SkSurface> makeOffscreenSurface(int width, int height) override {
    throw std::runtime_error("VisionCameraSkiaContext::makeOffscreenSurface is not yet implemented!");
  }

  void runOnMainThread(std::function<void()> task) override {
    throw std::runtime_error("VisionCameraSkiaContext::runOnMainThread is not yet implemented!");
  }

  sk_sp<SkImage> takeScreenshotFromViewTag(size_t tag) override {
    throw std::runtime_error("VisionCameraSkiaContext::takeScreenshotFromViewTag is not yet implemented!");
  }

  void startDrawLoop() override {
    throw std::runtime_error("VisionCameraSkiaContext::startDrawLoop is not yet implemented!");
  }

  void stopDrawLoop() override {
    throw std::runtime_error("VisionCameraSkiaContext::stopDrawLoop is not yet implemented!");
  }
};

} // namespace vision
