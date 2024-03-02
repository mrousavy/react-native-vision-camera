//
// Created by Marc Rousavy on 02.03.24.
//

#pragma once

#include <react-native-skia/RNSkPlatformContext.h>
#include <react-native-skia/SkiaOpenGLSurfaceFactory.h>
#include <jsi/jsi.h>
#include <ReactCommon/CallInvoker.h>

namespace vision {

using namespace facebook;

class VisionCameraSkiaContext: public RNSkia::RNSkPlatformContext {
public:
    explicit VisionCameraSkiaContext(jsi::Runtime* runtime,
                                     const std::shared_ptr<react::CallInvoker> callInvoker):
                                     RNSkia::RNSkPlatformContext(runtime, callInvoker, 1.0f) {
        // TODO: Use RNSkia's Platform context instead of creating our own.
    }

    sk_sp<SkSurface> makeOffscreenSurface(int width, int height) override {
        return RNSkia::SkiaOpenGLSurfaceFactory::makeOffscreenSurface(width, height);
    }

    sk_sp<SkFontMgr> createFontMgr() override {
        throw std::runtime_error("createFontMgr is not yet implemented!");
    }

    void makeViewScreenshot(int viewTag, std::function<void (sk_sp<SkImage>)> callback) override {
        throw std::runtime_error("makeViewScreenshot is not yet implemented!");
    }

    void performStreamOperation(const std::string &sourceUri, const std::function<void (std::unique_ptr<SkStreamAsset>)> &op) override {
        throw std::runtime_error("performStreamOperation is not yet implemented!");
    }

    void runOnMainThread(std::function<void ()> func) override {
        throw std::runtime_error("runOnMainThread is not yet implemented!");
    }

    void raiseError(const std::exception &err) override {
        throw std::runtime_error("raiseError is not yet implemented!");
    }

    void startDrawLoop() override {
        throw std::runtime_error("startDrawLoop is not yet implemented!");
    }

    void stopDrawLoop() override {
        throw std::runtime_error("stopDrawLoop is not yet implemented!");
    }

    sk_sp<SkImage> takeScreenshotFromViewTag(size_t tag) override {
        throw std::runtime_error("takeScreenshotFromViewTag is not yet implemented!");
    }
};

} // vision
