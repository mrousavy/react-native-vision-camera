//
// Created by Marc Rousavy on 29.09.21.
//

#if VISION_CAMERA_ENABLE_FRAME_PROCESSORS

#include "JFrameProcessor.h"
#include <fbjni/fbjni.h>
#include <jni.h>

#include "JFrame.h"
#include <utility>

namespace vision {

using namespace facebook;
using namespace jni;

void JFrameProcessor::registerNatives() {
  registerHybrid({makeNativeMethod("call", JFrameProcessor::call)});
}

using TSelf = jni::local_ref<JFrameProcessor::javaobject>;

JFrameProcessor::JFrameProcessor(std::shared_ptr<RNWorklet::JsiWorklet> worklet, std::shared_ptr<RNWorklet::JsiWorkletContext> context) {
  _workletContext = std::move(context);
  _workletInvoker = std::make_shared<RNWorklet::WorkletInvoker>(worklet);
}

TSelf JFrameProcessor::create(const std::shared_ptr<RNWorklet::JsiWorklet>& worklet,
                              const std::shared_ptr<RNWorklet::JsiWorkletContext>& context) {
  return JFrameProcessor::newObjectCxxArgs(worklet, context);
}

void JFrameProcessor::callWithFrameHostObject(const std::shared_ptr<FrameHostObject>& frameHostObject) const {
  // Call the Frame Processor on the Worklet Runtime
  jsi::Runtime& runtime = _workletContext->getWorkletRuntime();

  // Wrap HostObject as JSI Value
  auto argument = jsi::Object::createFromHostObject(runtime, frameHostObject);
  jsi::Value jsValue(std::move(argument));

  // Call the Worklet with the Frame JS Host Object as an argument
  _workletInvoker->call(runtime, jsi::Value::undefined(), &jsValue, 1);
}

void JFrameProcessor::call(jni::alias_ref<JFrame::javaobject> frame) {
  // Create the Frame Host Object wrapping the internal Frame
  auto frameHostObject = std::make_shared<FrameHostObject>(frame);
  callWithFrameHostObject(frameHostObject);
}

} // namespace vision

#endif
