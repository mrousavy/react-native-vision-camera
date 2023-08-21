//
// Created by Marc Rousavy on 29.09.21
//

#pragma once

#include <string>
#include <memory>
#include <jni.h>
#include <fbjni/fbjni.h>

#include <react-native-worklets-core/WKTJsiWorklet.h>
#include <react-native-worklets-core/WKTJsiHostObject.h>

#include "JFrame.h"
#include "FrameHostObject.h"

namespace vision {

using namespace facebook;

struct JFrameProcessor : public jni::HybridClass<JFrameProcessor> {
 public:
  static auto constexpr kJavaDescriptor = "Lcom/mrousavy/camera/frameprocessor/FrameProcessor;";
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
  explicit JFrameProcessor(std::shared_ptr<RNWorklet::JsiWorklet> worklet,
                           std::shared_ptr<RNWorklet::JsiWorkletContext> context);

 private:
  void callWithFrameHostObject(const std::shared_ptr<FrameHostObject>& frameHostObject) const;

 private:
  friend HybridBase;
  std::shared_ptr<RNWorklet::WorkletInvoker> _workletInvoker;
  std::shared_ptr<RNWorklet::JsiWorkletContext> _workletContext;
};

} // namespace vision
