//
// Created by Marc Rousavy on 21.07.23.
//

#pragma once

#include <React/RCTBridge.h>
#include <ReactCommon/CallInvoker.h>
#include <jsi/jsi.h>
#include <react-native-worklets/WKTJsiWorkletContext.h>
#include <jni.h>
#include <fbjni/fbjni.h>

#include "java-bindings/JVisionCameraScheduler.h"
#include "java-bindings/JCameraView.h"

namespace vision {

using namespace facebook;

class VisionCameraProxy: public jsi::HostObject {
public:
  explicit VisionCameraProxy(jsi::Runtime& runtime,
                             std::shared_ptr<react::CallInvoker> callInvoker,
                             jni::global_ref<vision::JVisionCameraScheduler::javaobject> scheduler);
  ~VisionCameraProxy();

public:
  std::vector<jsi::PropNameID> getPropertyNames(jsi::Runtime& runtime) override;
  jsi::Value get(jsi::Runtime& runtime, const jsi::PropNameID& name) override;

private:
  void setFrameProcessor(jsi::Runtime& runtime, int viewTag, const jsi::Object& frameProcessor);
  void removeFrameProcessor(jsi::Runtime& runtime, int viewTag);
  jsi::Value getFrameProcessorPlugin(jsi::Runtime& runtime, std::string name, const jsi::Object& options);
  jni::global_ref<JCameraView::javaobject> findCameraViewById(int viewId);

private:
  std::shared_ptr<RNWorklet::JsiWorkletContext> _workletContext;
  std::shared_ptr<react::CallInvoker> _callInvoker;
  jni::global_ref<JVisionCameraScheduler::javaobject> _scheduler;
  static constexpr const char* TAG = "VisionCameraProxy";
};


class VisionCameraInstaller: public jni::JavaClass<VisionCameraInstaller> {
public:
    static auto constexpr kJavaDescriptor = "Lcom/mrousavy/camera/frameprocessor/VisionCameraInstaller;";
    static void registerNatives() {
      javaClassStatic()->registerNatives({
        makeNativeMethod("install", VisionCameraInstaller::install)
      });
    }
    static void install(jni::alias_ref<jni::JClass> clazz,
                        jlong jsiRuntimePtr,
                        jni::alias_ref<react::CallInvokerHolder::javaobject> callInvoker,
                        jni::alias_ref<JVisionCameraScheduler::javaobject> scheduler);
};

}