#include "NativeBufferHelper.hpp"
#include "VisionCameraOnLoad.hpp"
#include <fbjni/fbjni.h>
#include <jni.h>

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void*) {
  return facebook::jni::initialize(vm, []() {
    // Initialize Nitro Specs
    margelo::nitro::camera::registerAllNatives();
    // Initialize custom JNI stuff
    margelo::nitro::camera::NativeBufferHelper::registerNatives();
  });
}
