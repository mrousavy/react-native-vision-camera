//
// Created by Marc Rousavy on 21.07.23.
//

#pragma once

#include <ReactCommon/CallInvokerHolder.h>
#include <fbjni/fbjni.h>
#include <jsi/jsi.h>

#include "JFrameProcessor.h"
#include "JFrameProcessorPlugin.h"
#include "JVisionCameraScheduler.h"

#include <memory>
#include <string>

#if VISION_CAMERA_ENABLE_FRAME_PROCESSORS
#include <react-native-worklets-core/WKTJsiWorkletContext.h>
#endif

namespace vision {

using namespace facebook;

class JVisionCameraProxy : public jni::HybridClass<JVisionCameraProxy> {
public:
  ~JVisionCameraProxy();
  static void registerNatives();

  void setFrameProcessor(int viewTag, jsi::Runtime& runtime, const std::shared_ptr<jsi::Function>& frameProcessor);
  void removeFrameProcessor(int viewTag);
  jni::local_ref<JFrameProcessorPlugin::javaobject> initFrameProcessorPlugin(const std::string& name,
                                                                             jni::local_ref<JMap<jstring, jobject>> options);

  jsi::Runtime* getJSRuntime() {
    return _runtime;
  }

#if VISION_CAMERA_ENABLE_FRAME_PROCESSORS
  jsi::Runtime& getWorkletRuntime() {
    return _workletContext->getWorkletRuntime();
  }

  std::shared_ptr<RNWorklet::JsiWorkletContext> getWorkletContext() {
    return _workletContext;
  }
#endif

private:
  friend HybridBase;
  jni::global_ref<JVisionCameraProxy::javaobject> _javaPart;
  jsi::Runtime* _runtime;
#if VISION_CAMERA_ENABLE_FRAME_PROCESSORS
  std::shared_ptr<RNWorklet::JsiWorkletContext> _workletContext;
#endif

  static auto constexpr TAG = "VisionCameraProxy";
  static auto constexpr kJavaDescriptor = "Lcom/mrousavy/camera/frameprocessors/VisionCameraProxy;";

  explicit JVisionCameraProxy(const jni::alias_ref<JVisionCameraProxy::jhybridobject>& javaThis, jsi::Runtime* jsRuntime,
                              const std::shared_ptr<facebook::react::CallInvoker>& jsCallInvoker,
                              const jni::global_ref<JVisionCameraScheduler::javaobject>& scheduler);
  static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jhybridobject> javaThis, jlong jsRuntimePointer,
                                                jni::alias_ref<facebook::react::CallInvokerHolder::javaobject> jsCallInvokerHolder,
                                                const jni::alias_ref<JVisionCameraScheduler::javaobject>& scheduler);
};

} // namespace vision
