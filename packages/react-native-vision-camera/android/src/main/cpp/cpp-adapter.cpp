#include <jni.h>
#include "NitroVisionCameraOnLoad.hpp"

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void*) {
  return margelo::nitro::visioncamera::initialize(vm);
}
