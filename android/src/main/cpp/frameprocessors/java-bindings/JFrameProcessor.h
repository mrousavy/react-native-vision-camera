//
// Created by Marc Rousavy on 29.09.21
//

#pragma once

#if VISION_CAMERA_ENABLE_FRAME_PROCESSORS

#include <fbjni/fbjni.h>
#include <jni.h>
#include <memory>
#include <string>

#include <react-native-worklets-core/WKTJsiHostObject.h>
#include <react-native-worklets-core/WKTJsiWorklet.h>

#include "FrameHostObject.h"
#include "JFrame.h"

namespace vision {

using namespace facebook;

struct JFrameProcessor : public jni::HybridClass<JFrameProcessor> {
public:
  static auto constexpr kJavaDescriptor = "Lcom/mrousavy/camera/frameprocessors/FrameProcessor;";
  static void registerNatives();
  static jni::local_ref<JFrameProcessor::javaobject> create(const std::shared_ptr<RNWorklet::JsiWorklet>& worklet,
                                                            const std::shared_ptr<RNWorklet::JsiWorkletContext>& context);

public:
  /**
   * Call the JS Frame Processor.
   */
  void call(alias_ref<JFrame::javaobject> frame);

private:
  // Private constructor. Use `create(..)` to create new instances.
  explicit JFrameProcessor(std::shared_ptr<RNWorklet::JsiWorklet> worklet, std::shared_ptr<RNWorklet::JsiWorkletContext> context);

private:
  void callWithFrameHostObject(const std::shared_ptr<FrameHostObject>& frameHostObject) const;

private:
  friend HybridBase;
  std::shared_ptr<RNWorklet::WorkletInvoker> _workletInvoker;
  std::shared_ptr<RNWorklet::JsiWorkletContext> _workletContext;
};

} // namespace vision

#endif
