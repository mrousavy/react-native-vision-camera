//
// Created by Marc Rousavy on 09.08.23.
//

#pragma once

#include <jni.h>
#include <fbjni/fbjni.h>
#include <string>
#include <memory>
#include "SkiaRenderer.h"

namespace vision {

using namespace facebook;

class SkiaPreviewView : public jni::HybridClass<SkiaPreviewView> {
 public:
  static auto constexpr kJavaDescriptor = "Lcom/mrousavy/camera/skia/SkiaPreviewView;";
  static auto constexpr TAG = "SkiaPreviewView (C++)";
  static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jhybridobject> jThis);
  static void registerNatives();

 private:
  // JNI Setup
  friend HybridBase;
  jni::global_ref<SkiaPreviewView::javaobject> javaPart_;
  explicit SkiaPreviewView(jni::alias_ref<SkiaPreviewView::jhybridobject> jThis): javaPart_(jni::make_global(jThis)) {}

 private:
  std::unique_ptr<SkiaRenderer> _renderer;

  // Update the Preview View UI (60 FPS)
  void onPreviewFrame();
  // Render the Camera Frame (1..240 FPS)
  void onCameraFrame();

  void onSurfaceCreated(jobject surface);
  void onSurfaceResized(int width, int height);
  void onSurfaceDestroyed();

  int getInputTextureId();
};

} // namespace vision
