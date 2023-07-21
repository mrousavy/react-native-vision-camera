//
// Created by Marc Rousavy on 21.07.23.
//

#pragma once

#include <fbjni/fbjni.h>
#include <jsi/jsi.h>
#include <react-native-worklets/WKTJsiWorkletContext.h>
#include <react/jni/ReadableNativeMap.h>

#include "JFrameProcessorPlugin.h"
#include "JVisionCameraScheduler.h"
#include "JFrameProcessor.h"

#include <string>
#include <memory>

namespace vision {

using namespace facebook;

class JVisionCameraProxy : public jni::HybridClass<JVisionCameraProxy> {
 public:
  static void registerNatives();

  void setFrameProcessor(int viewTag,
                         const jni::alias_ref<JFrameProcessor::javaobject>& frameProcessor);
  void removeFrameProcessor(int viewTag);
  jni::local_ref<JFrameProcessorPlugin::javaobject> getFrameProcessorPlugin(const std::string& name,
                                                                            jni::local_ref<react::ReadableNativeMap::javaobject> options);

 public:
  std::shared_ptr<RNWorklet::JsiWorkletContext> getWorkletContext() { return _workletContext; }

 private:
  std::shared_ptr<RNWorklet::JsiWorkletContext> _workletContext;

 private:
  friend HybridBase;
  jni::global_ref<JVisionCameraProxy::javaobject> _javaPart;
  static auto constexpr TAG = "VisionCameraProxy";
  static auto constexpr kJavaDescriptor = "Lcom/mrousavy/camera/frameprocessor/VisionCameraProxy;";

  explicit JVisionCameraProxy(const jni::alias_ref<JVisionCameraProxy::jhybridobject>& javaThis,
                              jsi::Runtime* jsRuntime,
                              const std::shared_ptr<facebook::react::CallInvoker>& jsCallInvoker,
                              const jni::global_ref<JVisionCameraScheduler::javaobject>& scheduler);
  static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jhybridobject> javaThis,
                                                jlong jsRuntimePointer,
                                                jni::alias_ref<facebook::react::CallInvokerHolder::javaobject> jsCallInvokerHolder,
                                                const jni::alias_ref<JVisionCameraScheduler::javaobject>& scheduler);
};

} // namespace vision
