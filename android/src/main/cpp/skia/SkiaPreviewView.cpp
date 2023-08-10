//
// Created by Marc Rousavy on 09.08.23.
//

#include "SkiaPreviewView.h"
#include <android/log.h>
#include <android/native_window_jni.h>

namespace vision {

jni::local_ref<SkiaPreviewView::jhybriddata> SkiaPreviewView::initHybrid(jni::alias_ref<jhybridobject> jThis) {
  return makeCxxInstance(jThis);
}

void SkiaPreviewView::destroy() {
  _renderer = nullptr;
}

void SkiaPreviewView::onSurfaceCreated(jobject surface) {
  ANativeWindow* previewSurface = ANativeWindow_fromSurface(jni::Environment::current(), surface);
  _renderer = std::make_unique<SkiaRenderer>(previewSurface);
}

void SkiaPreviewView::onSurfaceResized(int width, int height) {
  this->_surfaceWidth = width;
  this->_surfaceHeight = height;
}

void SkiaPreviewView::onSurfaceDestroyed() {
  destroy();
}

int SkiaPreviewView::createTexture() {
  if (_renderer == nullptr) throw std::runtime_error("SkiaRenderer was not yet initialized! Call onSurfaceCreated() first.");
  return _renderer->createTexture();
}

void SkiaPreviewView::onCameraFrame() {
  __android_log_print(ANDROID_LOG_INFO, TAG, "Rendering Camera Frame...");
}

void SkiaPreviewView::onPreviewFrame() {
  __android_log_print(ANDROID_LOG_INFO, TAG, "Rendering Preview UI...");
}

void SkiaPreviewView::registerNatives() {
  registerHybrid({
    makeNativeMethod("initHybrid", SkiaPreviewView::initHybrid),
    makeNativeMethod("destroy", SkiaPreviewView::destroy),
    makeNativeMethod("onCameraFrame", SkiaPreviewView::onCameraFrame),
    makeNativeMethod("onPreviewFrame", SkiaPreviewView::onPreviewFrame),
    makeNativeMethod("onSurfaceResized", SkiaPreviewView::onSurfaceResized),
    makeNativeMethod("onSurfaceCreated", SkiaPreviewView::onSurfaceCreated),
    makeNativeMethod("onSurfaceDestroyed", SkiaPreviewView::onSurfaceDestroyed),
    makeNativeMethod("createTexture", SkiaPreviewView::createTexture),
  });
}


} // namespace vision
