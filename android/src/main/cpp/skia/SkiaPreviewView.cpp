//
// Created by Marc Rousavy on 09.08.23.
//

#include "SkiaPreviewView.h"

namespace vision {


jni::local_ref<SkiaPreviewView::jhybriddata> SkiaPreviewView::initHybrid(jni::alias_ref<jhybridobject> jThis) {
  return makeCxxInstance(jThis);
}

void SkiaPreviewView::registerNatives() {
  registerHybrid({
    makeNativeMethod("initHybrid", SkiaPreviewView::initHybrid),
  });
}

} // namespace vision