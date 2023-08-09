//
// Created by Marc Rousavy on 09.08.23.
//

#pragma once

#include <jni.h>
#include <fbjni/fbjni.h>

namespace vision {

using namespace facebook;

class SkiaPreviewView : public jni::HybridClass<SkiaPreviewView> {
 public:
  static auto constexpr kJavaDescriptor = "Lcom/mrousavy/camera/skia/SkiaPreviewView;";
  static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jhybridobject> jThis);
  static void registerNatives();

 private:
  friend HybridBase;
  jni::global_ref<SkiaPreviewView::javaobject> javaPart_;

  explicit SkiaPreviewView(jni::alias_ref<SkiaPreviewView::jhybridobject> jThis):
  javaPart_(jni::make_global(jThis)) {}
};

} // namespace vision