#include <jni.h>
#include <fbjni/fbjni.h>
#include "FrameProcessorRuntimeManager.h"
#include "FrameProcessorPlugin.h"
#include "CameraView.h"

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM *vm, void *) {
  return facebook::jni::initialize(vm, [] {
    vision::FrameProcessorRuntimeManager::registerNatives();
    vision::FrameProcessorPlugin::registerNatives();
    vision::CameraView::registerNatives();
  });
}
