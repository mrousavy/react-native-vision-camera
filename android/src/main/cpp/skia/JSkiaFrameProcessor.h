//
// Created by Marc Rousavy on 31.08.23.
//

#pragma once

#if VISION_CAMERA_ENABLE_FRAME_PROCESSORS && VISION_CAMERA_ENABLE_SKIA

#include <string>
#include <memory>
#include <jni.h>
#include <fbjni/fbjni.h>

#include <react-native-worklets-core/WKTJsiWorklet.h>
#include <react-native-worklets-core/WKTJsiHostObject.h>

#include "JFrame.h"
#include "FrameHostObject.h"
#include "SkiaRenderer.h"
#include "JFrameProcessor.h"

namespace vision {

using namespace facebook;

class JSkiaFrameProcessor : public jni::HybridClass<JSkiaFrameProcessor, JFrameProcessor> {
 public:
  static auto constexpr kJavaDescriptor = "Lcom/mrousavy/camera/skia/SkiaFrameProcessor;";
  static void registerNatives();
  static jni::local_ref<JSkiaFrameProcessor::javaobject> create(const std::shared_ptr<RNWorklet::JsiWorklet>& worklet,
                                                                const std::shared_ptr<RNWorklet::JsiWorkletContext>& context,
                                                                const std::shared_ptr<SkiaRenderer>& skiaRenderer);
 public:
  /**
   * Call the JS Frame Processor with the given Skia context applied.
   */
  void call(alias_ref<JFrame::javaobject> frame);

 protected:
  friend HybridBase;
  // Private constructor. Use `create(..)` to create new instances.
  explicit JSkiaFrameProcessor(std::shared_ptr<RNWorklet::JsiWorklet> worklet,
                               std::shared_ptr<RNWorklet::JsiWorkletContext> context,
                               std::shared_ptr<SkiaRenderer> skiaRenderer);

 private:
  std::shared_ptr<RNWorklet::WorkletInvoker> _workletInvoker;
  std::shared_ptr<RNWorklet::JsiWorkletContext> _workletContext;
  std::shared_ptr<SkiaRenderer> _skiaRenderer;
};

} // namespace vision

#endif
