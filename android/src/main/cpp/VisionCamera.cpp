#include <jni.h>
#include <fbjni/fbjni.h>
#include "FrameProcessorRuntimeManager.h"
#include "CameraView.h"
#include "VisionCameraScheduler.h"

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM *vm, void *) {
  return facebook::jni::initialize(vm, [] {
    vision::FrameProcessorRuntimeManager::registerNatives();
    vision::CameraView::registerNatives();
    vision::VisionCameraScheduler::registerNatives();
  });
}
