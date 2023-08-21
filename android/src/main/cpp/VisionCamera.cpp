#include <jni.h>
#include <fbjni/fbjni.h>
#include "java-bindings/JVisionCameraScheduler.h"
#include "java-bindings/JFrameProcessor.h"
#include "java-bindings/JVisionCameraProxy.h"
#include "VisionCameraProxy.h"
#include "skia/SkiaRenderer.h"

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM *vm, void *) {
  return facebook::jni::initialize(vm, [] {
    vision::VisionCameraInstaller::registerNatives();
    vision::JFrameProcessor::registerNatives();
    vision::JVisionCameraProxy::registerNatives();
    vision::JVisionCameraScheduler::registerNatives();
    vision::SkiaRenderer::registerNatives();
  });
}
