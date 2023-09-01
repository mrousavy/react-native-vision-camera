#include "JFrameProcessor.h"
#include "JVisionCameraProxy.h"
#include "JVisionCameraScheduler.h"
#include "VideoPipeline.h"
#include "VisionCameraProxy.h"
#include <fbjni/fbjni.h>
#include <jni.h>

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void*) {
  return facebook::jni::initialize(vm, [] {
    vision::VisionCameraInstaller::registerNatives();
    vision::JVisionCameraProxy::registerNatives();
    vision::JVisionCameraScheduler::registerNatives();
    vision::VideoPipeline::registerNatives();
#if VISION_CAMERA_ENABLE_FRAME_PROCESSORS
    vision::JFrameProcessor::registerNatives();
#endif
  });
}
