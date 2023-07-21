//
// Created by Marc Rousavy on 29.09.21
//

#pragma once

#include <string>
#include <memory>
#include <jni.h>
#include <fbjni/fbjni.h>

#include <react-native-worklets/WKTJsiWorklet.h>
#include <react-native-worklets/WKTJsiHostObject.h>

#include "JFrame.h"

namespace vision {

using namespace facebook;

struct JFrameProcessor : public jni::HybridClass<JFrameProcessor> {
public:
  static auto constexpr kJavaDescriptor = "Lcom/mrousavy/camera/frameprocessor/FrameProcessor;";
  static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jhybridobject> jThis);
  static void registerNatives();
  explicit JFrameProcessor(std::shared_ptr<RNWorklet::JsiWorklet> worklet,
                           std::shared_ptr<RNWorklet::JsiWorkletContext> context);

public:
  /**
   * Call the JS Frame Processor.
   */
  void call(alias_ref<JFrame::javaobject> frame) const;

private:
  friend HybridBase;
  jni::global_ref<JFrameProcessor::javaobject> javaPart_;
};

} // namespace vision
