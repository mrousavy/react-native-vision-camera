//
// Created by Marc Rousavy on 11.06.21.
//

#pragma once

#include <fbjni/fbjni.h>
#include <jsi/jsi.h>
#include <ReactCommon/CallInvokerHolder.h>
#include <memory>
#include <string>

#include "RuntimeManager.h"
#include "reanimated-headers/AndroidScheduler.h"

#include "CameraView.h"
#include "VisionCameraScheduler.h"
#include "java-bindings/JFrameProcessorPlugin.h"

namespace vision {

using namespace facebook;

class FrameProcessorRuntimeManager : public jni::HybridClass<FrameProcessorRuntimeManager> {
 public:
  static auto constexpr kJavaDescriptor = "Lcom/mrousavy/camera/frameprocessor/FrameProcessorRuntimeManager;";
  static auto constexpr TAG = "VisionCamera";
  static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jhybridobject> jThis,
                                                jlong jsContext,
                                                jni::alias_ref<facebook::react::CallInvokerHolder::javaobject> jsCallInvokerHolder,
                                                jni::alias_ref<vision::VisionCameraScheduler::javaobject> frameProcessorScheduler,
                                                jni::alias_ref<reanimated::AndroidScheduler::javaobject> uiScheduler);
  static void registerNatives();

  explicit FrameProcessorRuntimeManager(jni::alias_ref<FrameProcessorRuntimeManager::jhybridobject> jThis,
                                        jsi::Runtime* runtime,
                                        std::shared_ptr<facebook::react::CallInvoker> jsCallInvoker,
                                        jni::alias_ref<vision::VisionCameraScheduler::javaobject> frameProcessorScheduler,
                                        jni::alias_ref<reanimated::AndroidScheduler::javaobject> uiScheduler) :
      _javaPart(jni::make_global(jThis)),
      _runtime(runtime),
      _jsCallInvoker(jsCallInvoker),
      _frameProcessorScheduler(jni::make_global(frameProcessorScheduler)),
      _uiScheduler(jni::make_global(uiScheduler))
  {}

 private:
  friend HybridBase;
  jni::global_ref<FrameProcessorRuntimeManager::javaobject> _javaPart;
  jsi::Runtime* _runtime;
  std::shared_ptr<facebook::react::CallInvoker> _jsCallInvoker;
  std::shared_ptr<reanimated::RuntimeManager> _runtimeManager;
  jni::global_ref<vision::VisionCameraScheduler::javaobject> _frameProcessorScheduler;
  jni::global_ref<reanimated::AndroidScheduler::javaobject> _uiScheduler;

  jni::global_ref<CameraView::javaobject> findCameraViewById(int viewId);
  void initializeRuntime();
  void installJSIBindings();
  void registerPlugin(alias_ref<JFrameProcessorPlugin::javaobject> plugin);
  void logErrorToJS(const std::string& message);

  void setFrameProcessor(jsi::Runtime& runtime,                 // NOLINT(runtime/references)
                         int viewTag,
                         const jsi::Value& frameProcessor);
  void unsetFrameProcessor(int viewTag);
};

} // namespace vision
