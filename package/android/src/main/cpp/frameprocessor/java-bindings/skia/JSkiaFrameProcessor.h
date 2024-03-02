//
// Created by Marc Rousavy on 02.03.24.
//

#pragma once

#include "JFrameProcessor.h"
#include <fbjni/fbjni.h>
#include <ReactCommon/CallInvoker.h>
#include "VisionCameraSkiaContext.h"
#include <react-native-skia/JsiSkCanvas.h>

namespace vision {

using namespace facebook;

class JSkiaFrameProcessor: public jni::HybridClass<JSkiaFrameProcessor, JFrameProcessor> {
public:
    static auto constexpr kJavaDescriptor = "Lcom/mrousavy/camera/frameprocessor/skia/SkiaFrameProcessor;";
    static void registerNatives();
    static jni::local_ref<JSkiaFrameProcessor::javaobject> create(const std::shared_ptr<RNWorklet::JsiWorklet>& worklet,
                                                                  const std::shared_ptr<RNWorklet::JsiWorkletContext>& context,
                                                                  const std::shared_ptr<react::CallInvoker>& callInvoker);

public:
    void call(jni::alias_ref<JFrame> frame, jobject surface);

private:
    // Private constructor. Use `create(..)` to create new instances.
    explicit JSkiaFrameProcessor(const std::shared_ptr<RNWorklet::JsiWorklet>& worklet,
                                 const std::shared_ptr<RNWorklet::JsiWorkletContext>& context,
                                 const std::shared_ptr<react::CallInvoker>& callInvoker);

private:
    friend HybridBase;

private:
    std::shared_ptr<VisionCameraSkiaContext> _skiaContext;
    std::shared_ptr<RNSkia::JsiSkCanvas> _canvas;
};

} // vision

