#include <jni.h>
#include <fbjni/fbjni.h>
#include "JVisionCameraScheduler.h"
#include "JFrameProcessor.h"
#include "JVisionCameraProxy.h"
#include "VisionCameraProxy.h"
#include "SkiaRenderer.h"
#include "VideoPipeline.h"

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM *vm, void *) {
  return facebook::jni::initialize(vm, [] {
    vision::VisionCameraInstaller::registerNatives();
    vision::JVisionCameraProxy::registerNatives();
    vision::JVisionCameraScheduler::registerNatives();
    vision::VideoPipeline::registerNatives();
#if VISION_CAMERA_ENABLE_FRAME_PROCESSORS
    vision::JFrameProcessor::registerNatives();
#endif
#if VISION_CAMERA_ENABLE_SKIA
    vision::SkiaRenderer::registerNatives();
#endif
  });
}
