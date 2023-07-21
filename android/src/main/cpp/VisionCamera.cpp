#include <jni.h>
#include <fbjni/fbjni.h>
#include "FrameProcessorRuntimeManager.h"
#include "java-bindings/JCameraView.h"
#include "java-bindings/JVisionCameraScheduler.h"
#include "VisionCameraProxy.h"

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM *vm, void *) {
  return facebook::jni::initialize(vm, [] {
    vision::VisionCameraInstaller::registerNatives();
    vision::JCameraView::registerNatives();
    vision::JVisionCameraScheduler::registerNatives();
  });
}
