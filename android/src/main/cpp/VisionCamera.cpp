#include <jni.h>
#include <fbjni/fbjni.h>
#include "CameraViewModule.h"

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM *vm, void *) {
  return facebook::jni::initialize(vm, [] {
    vision::CameraViewModule::registerNatives();
  });
}
