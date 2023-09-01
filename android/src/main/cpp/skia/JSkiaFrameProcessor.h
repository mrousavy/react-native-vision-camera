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

#include <JsiSkCanvas.h>
#include <RNSkPlatformContext.h>

namespace vision {

using namespace facebook;

class JSkiaFrameProcessor : public jni::HybridClass<JSkiaFrameProcessor, JFrameProcessor> {
 public:
  static auto constexpr kJavaDescriptor = "Lcom/mrousavy/camera/skia/SkiaFrameProcessor;";
  static void registerNatives();
  static jni::local_ref<JSkiaFrameProcessor::javaobject> create(const std::shared_ptr<RNWorklet::JsiWorklet>& worklet,
                                                                const std::shared_ptr<RNWorklet::JsiWorkletContext>& context,
                                                                const std::shared_ptr<react::CallInvoker>& callInvoker);
 public:
  /**
   * Call the JS Frame Processor with the given valid Canvas to draw on.
   */
  void call(jni::alias_ref<JFrame::javaobject> frame,
            SkCanvas* canvas);

  SkiaRenderer& getSkiaRenderer() { return *_skiaRenderer; }

 protected:
  friend HybridBase;
  // Private constructor. Use `create(..)` to create new instances.
  explicit JSkiaFrameProcessor(const std::shared_ptr<RNWorklet::JsiWorklet>& worklet,
                               const std::shared_ptr<RNWorklet::JsiWorkletContext>& context,
                               const std::shared_ptr<react::CallInvoker>& callInvoker);

 private:
  std::shared_ptr<RNSkia::JsiSkCanvas> _jsiCanvas;
  std::shared_ptr<SkiaRenderer> _skiaRenderer;
};

} // namespace vision

#endif
