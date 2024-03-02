//
// Created by Marc Rousavy on 02.03.24.
//

#include "JSkiaFrameProcessor.h"
#include "FrameHostObject.h"
#include <ReactCommon/CallInvoker.h>
#include "DrawableFrameHostObject.h"

#include <react-native-skia/JsiSkCanvas.h>
#include <react-native-skia/RNSkAndroidPlatformContext.h>
#include <react-native-skia/SkiaOpenGLSurfaceFactory.h>

namespace vision {

using namespace facebook;

jni::local_ref<JSkiaFrameProcessor::javaobject> JSkiaFrameProcessor::create(const std::shared_ptr<RNWorklet::JsiWorklet>& worklet,
                                                                            const std::shared_ptr<RNWorklet::JsiWorkletContext>& context,
                                                                            const std::shared_ptr<react::CallInvoker>& callInvoker) {
    return JSkiaFrameProcessor::newObjectCxxArgs(worklet, context, callInvoker);
}

JSkiaFrameProcessor::JSkiaFrameProcessor(const std::shared_ptr<RNWorklet::JsiWorklet>& worklet,
                                         const std::shared_ptr<RNWorklet::JsiWorkletContext>& context,
                                         const std::shared_ptr<react::CallInvoker>& callInvoker): JSkiaFrameProcessor::HybridBase(worklet, context) {
    // TODO: Use AndroidPlatformContext from RNSkia
    _skiaContext = std::make_shared<VisionCameraSkiaContext>(context->getJsRuntime(),
                                                             callInvoker);
    _canvas = std::make_shared<RNSkia::JsiSkCanvas>(_skiaContext);
}

void JSkiaFrameProcessor::call(jni::alias_ref<JFrame> frame, jobject surface) {
    auto skiaWindowSurface = RNSkia::SkiaOpenGLSurfaceFactory::makeWindowedSurface(surface,
                                                                                   frame->getWidth(),
                                                                                   frame->getHeight());
    auto skiaSurface = skiaWindowSurface->getSurface();
    _canvas->setCanvas(skiaSurface->getCanvas());

    auto frameHostObject = std::make_shared<DrawableFrameHostObject>(frame);
    frameHostObject->setCanvas(_canvas);

    JFrameProcessor::callWithFrameHostObject(frameHostObject);

    frameHostObject->setCanvas(nullptr);
}

} // vision