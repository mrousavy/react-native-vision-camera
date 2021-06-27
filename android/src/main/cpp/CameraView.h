//
// Created by Marc Rousavy on 14.06.21.
//

#pragma once

#include <jni.h>
#include <fbjni/fbjni.h>

#include <memory>

#include "JImageProxy.h"

namespace vision {

using namespace facebook;
using FrameProcessor = std::function<void(jni::local_ref<JImageProxy::javaobject>)>;

class CameraView : public jni::HybridClass<CameraView> {
 public:
  static auto constexpr kJavaDescriptor = "Lcom/mrousavy/camera/CameraView;";
  static auto constexpr TAG = "VisionCamera";
  static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jhybridobject> jThis);
  static void registerNatives();

  // TODO: Use template<> to avoid heap allocation for std::function<>
  void setFrameProcessor(const FrameProcessor&& frameProcessor);
  void unsetFrameProcessor();
  void setEnableFrameProcessor(bool enable);

 private:
  friend HybridBase;
  jni::global_ref<CameraView::javaobject> javaPart_;
  FrameProcessor frameProcessor_;

  void frameProcessorCallback(const jni::alias_ref<JImageProxy::javaobject>& frame);

  explicit CameraView(jni::alias_ref<CameraView::jhybridobject> jThis) :
    javaPart_(jni::make_global(jThis)),
    frameProcessor_(nullptr)
  {}
};

} // namespace vision
