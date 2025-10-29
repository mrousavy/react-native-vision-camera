#include <jni.h>
#include "VisionCameraOnLoad.hpp"

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void*) {
  return margelo::nitro::visioncamera::initialize(vm);
}
