//
// Created by Marc Rousavy on 09.08.23.
//

#include "SkiaPreviewView.h"
#include <GLES2/gl2.h>
#include <EGL/egl.h>

#include <include/gpu/GrBackendSurface.h>
#include <include/gpu/ganesh/SkSurfaceGanesh.h>
#include <include/core/SkColorSpace.h>
#include <include/core/SkCanvas.h>
#include <gpu/gl/GrGLTypes.h>
#include <gpu/gl/GrGLInterface.h>
#include <gpu/GrDirectContext.h>
#include <core/SkSurface.h>

#include <android/log.h>

// Defined in <gpu/ganesh/gl/GrGLDefines.h>
#define GR_GL_RGBA8 0x8058

namespace vision {

jni::local_ref<SkiaPreviewView::jhybriddata> SkiaPreviewView::initHybrid(jni::alias_ref<jhybridobject> jThis) {
  return makeCxxInstance(jThis);
}

void SkiaPreviewView::destroy() {
  _renderer = nullptr;
}

void SkiaPreviewView::onSurfaceCreated() {
  _renderer = std::make_unique<SkiaRenderer>();
}

void SkiaPreviewView::onSurfaceDestroyed() {
  destroy();
}

int SkiaPreviewView::createTexture() {
  if (_renderer == nullptr) throw std::runtime_error("SkiaRenderer was not yet initialized! Call onSurfaceCreated() first.");
  return _renderer->createTexture();
}

sk_sp<SkSurface> createSkiaSurface(int textureId, int width, int height) {
  return nullptr;
}

void SkiaPreviewView::onDrawFrame(int texture, int textureWidth, int textureHeight) {
  return;
}

void SkiaPreviewView::onSurfaceResized(int width, int height) {
  this->_surfaceWidth = width;
  this->_surfaceHeight = height;
}

void SkiaPreviewView::registerNatives() {
  registerHybrid({
    makeNativeMethod("initHybrid", SkiaPreviewView::initHybrid),
    makeNativeMethod("destroy", SkiaPreviewView::destroy),
    makeNativeMethod("onDrawFrame", SkiaPreviewView::onDrawFrame),
    makeNativeMethod("onSurfaceResized", SkiaPreviewView::onSurfaceResized),
    makeNativeMethod("onSurfaceCreated", SkiaPreviewView::onSurfaceCreated),
    makeNativeMethod("onSurfaceDestroyed", SkiaPreviewView::onSurfaceDestroyed),
    makeNativeMethod("createTexture", SkiaPreviewView::createTexture),
  });
}


} // namespace vision
