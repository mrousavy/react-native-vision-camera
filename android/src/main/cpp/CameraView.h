//
// Created by Marc Rousavy on 14.06.21.
//

#pragma once

#include <fbjni/fbjni.h>

namespace vision {

using namespace facebook;

class CameraView : public jni::HybridClass<CameraView> {
public:
  static auto constexpr kJavaDescriptor = "Lcom/mrousavy/camera/CameraView;";
  static auto constexpr TAG = "VisionCamera";
  static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jhybridobject> jThis);
  static void registerNatives();

  // TODO: Use template<> to avoid heap allocation for std::function<>
  void setFrameProcessor(const std::function<void(int)>& frameProcessor);

private:
  friend HybridBase;
  jni::global_ref<CameraView::javaobject> javaPart_;

  void frameProcessorCallback(int frame);

  explicit CameraView(jni::alias_ref<CameraView::jhybridobject> jThis) :
    javaPart_(jni::make_global(jThis))
  {}
};

} // namespace vision
