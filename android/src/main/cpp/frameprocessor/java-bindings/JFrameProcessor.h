//
// Created by Marc Rousavy on 29.09.21
//

#pragma once

#if VISION_CAMERA_ENABLE_FRAME_PROCESSORS

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

class JFrameProcessor : public jni::HybridClass<JFrameProcessor> {
 public:
  static auto constexpr kJavaDescriptor = "Lcom/mrousavy/camera/frameprocessor/FrameProcessor;";
  static void registerNatives();
  static jni::local_ref<JFrameProcessor::javaobject> create(const std::shared_ptr<RNWorklet::JsiWorklet>& worklet,
                                                            const std::shared_ptr<RNWorklet::JsiWorkletContext>& context);

 public:
  /**
   * Wrap the Frame in a HostObject and call the Frame Processor.
   */
  void call(jni::alias_ref<JFrame::javaobject> frame);

 protected:
  friend HybridBase;
  // C++ only constructor. Use `create(..)` to create new instances.
  explicit JFrameProcessor(std::shared_ptr<RNWorklet::JsiWorklet> worklet,
                           std::shared_ptr<RNWorklet::JsiWorkletContext> context);
  JFrameProcessor(const JFrameProcessor &) = delete;
  JFrameProcessor &operator=(const JFrameProcessor &) = delete;

 protected:
  /**
   * Call the JS Frame Processor with the given Frame Host Object.
   */
  void callWithFrameHostObject(const std::shared_ptr<FrameHostObject>& frameHostObject) const;

 private:
  std::shared_ptr<RNWorklet::WorkletInvoker> _workletInvoker;
  std::shared_ptr<RNWorklet::JsiWorkletContext> _workletContext;
};

} // namespace vision

#endif
