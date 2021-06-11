#include <jni.h>
// #include <jsi/jsi.h>
// #include <memory>
#include <fbjni/fbjni.h>
// #include <ReactCommon/CallInvokerHolder.h>
// #include <react/jni/JavaScriptExecutorHolder.h>
// #include <android/log.h>

// #include "VisionCameraInstaller.h"

// #include "Scheduler.h"
// #include "AndroidErrorHandler.h"
// #include "AndroidScheduler.h"

// using namespace facebook;
// using namespace reanimated;

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM *vm, void *) {
  return facebook::jni::initialize(vm, [] {
    // TODO: Register natives (hybrid classes)
    // VisionCameraInstaller::registerNatives();
  });
}
