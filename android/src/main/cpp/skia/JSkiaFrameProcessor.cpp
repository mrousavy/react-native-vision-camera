//
// Created by Marc Rousavy on 31.08.23.
//

#if VISION_CAMERA_ENABLE_FRAME_PROCESSORS && VISION_CAMERA_ENABLE_SKIA

#include "JSkiaFrameProcessor.h"
#include <jni.h>
#include <fbjni/fbjni.h>

#include <utility>
#include "JFrame.h"

namespace vision {

using namespace facebook;
using namespace jni;

void JSkiaFrameProcessor::registerNatives() {
  registerHybrid({
    makeNativeMethod("call", JSkiaFrameProcessor::call)
  });
}

using TSelf = jni::local_ref<JSkiaFrameProcessor::javaobject>;

JSkiaFrameProcessor::JSkiaFrameProcessor(std::shared_ptr<RNWorklet::JsiWorklet> worklet,
                                         std::shared_ptr<RNWorklet::JsiWorkletContext> context,
                                         std::shared_ptr<SkiaRenderer> skiaRenderer)
                                         : JSkiaFrameProcessor::HybridBase(std::move(worklet), std::move(context)) {
  _skiaRenderer = std::move(skiaRenderer);
}

TSelf JSkiaFrameProcessor::create(const std::shared_ptr<RNWorklet::JsiWorklet>& worklet,
                                  const std::shared_ptr<RNWorklet::JsiWorkletContext>& context,
                                  const std::shared_ptr<SkiaRenderer>& skiaRenderer) {
  return JSkiaFrameProcessor::newObjectCxxArgs(worklet, context, skiaRenderer);
}

void JSkiaFrameProcessor::call(alias_ref<JFrame::javaobject> frame) {
  // Create the Frame Host Object wrapping the internal Frame
  auto frameHostObject = std::make_shared<FrameHostObject>(frame);

  // Call the base function in JFrameProcessor
  callWithFrameHostObject(frameHostObject);
}

} // namespace vision

#endif
