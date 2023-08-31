//
// Created by Marc Rousavy on 31.08.23.
//

#if VISION_CAMERA_ENABLE_FRAME_PROCESSORS && VISION_CAMERA_ENABLE_SKIA

#include "JSkiaFrameProcessor.h"
#include <jni.h>
#include <fbjni/fbjni.h>

#include <utility>
#include "JFrame.h"
#include "DrawableFrameHostObject.h"

#include <RNSkPlatformContext.h>
#include <RNSkAndroidPlatformContext.h>
#include <JniPlatformContext.h>

namespace vision {

using namespace facebook;
using namespace jni;

void JSkiaFrameProcessor::registerNatives() {
}

using TSelf = jni::local_ref<JSkiaFrameProcessor::javaobject>;

JSkiaFrameProcessor::JSkiaFrameProcessor(const std::shared_ptr<RNWorklet::JsiWorklet>& worklet,
                                         const std::shared_ptr<RNWorklet::JsiWorkletContext>& context,
                                         const std::shared_ptr<react::CallInvoker>& callInvoker)
                                         : JSkiaFrameProcessor::HybridBase(worklet, context) {
  // TODO: Pass correct JNI platform context
  //auto platformContext = std::make_shared<RNSkia::RNSkAndroidPlatformContext>(nullptr,
  //                                                                            context->getJsRuntime(),
  //                                                                            callInvoker);
  // TODO: Can I pass a nullptr as context here?
  _jsiCanvas = std::make_shared<RNSkia::JsiSkCanvas>(nullptr);
}

TSelf JSkiaFrameProcessor::create(const std::shared_ptr<RNWorklet::JsiWorklet>& worklet,
                                  const std::shared_ptr<RNWorklet::JsiWorkletContext>& context,
                                  const std::shared_ptr<react::CallInvoker>& callInvoker) {
  return JSkiaFrameProcessor::newObjectCxxArgs(worklet, context, callInvoker);
}

void JSkiaFrameProcessor::call(alias_ref<JFrame::javaobject> frame,
                               SkCanvas* canvas) {
  // Create the Frame Host Object wrapping the internal Frame and Skia Canvas
  _jsiCanvas->setCanvas(canvas);
  auto frameHostObject = std::make_shared<DrawableFrameHostObject>(frame, _jsiCanvas);

  // Call the base function in JFrameProcessor
  callWithFrameHostObject(frameHostObject);

  // Remove Skia Canvas from Host Object because it is no longer valid
  frameHostObject->invalidateCanvas();
}

} // namespace vision

#endif
