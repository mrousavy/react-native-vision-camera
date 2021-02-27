//
// Created by Marc Rousavy on 2/27/21.
//

#include <jni.h>
#include <jsi/jsi.h>
#include <hermes/hermes.h>

// TODO: Check ifdef ENABLE_FRAME_PROCESSORS

using namespace facebook;

// TODO: Lazily initialize this, and only on a per-view basis
static std::unique_ptr<jsi::Runtime> frameProcessorRuntime;

void install(jsi::Runtime& jsiRuntime) {
    // TODO: "dynamically" load Hermes and Reanimated
    frameProcessorRuntime = hermes::makeHermesRuntime();

    // setFrameProcessor(viewTag: number, frameProcessor: (frame: Frame) => void)
    auto setFrameProcessor = jsi::Function::createFromHostFunction(jsiRuntime,
                                                                   jsi::PropNameID::forAscii(jsiRuntime, "setFrameProcessor"),
                                                                   2,  // viewTag, frameProcessor
                                                                   [](jsi::Runtime& runtime, const jsi::Value& thisValue, const jsi::Value* arguments, size_t count) -> jsi::Value {
                                                                       if (!arguments[0].isNumber()) throw jsi::JSError(runtime, "Camera::setFrameProcessor: First argument ('viewTag') must be a number!");
                                                                       if (!arguments[1].isObject()) throw jsi::JSError(runtime, "Camera::setFrameProcessor: Second argument ('frameProcessor') must be a function!");

                                                                       auto viewTag = arguments[0].asNumber();
                                                                       auto worklet = arguments[1].asObject(runtime).asFunction(runtime);

                                                                       // TODO: "Workletize" the worklet object by passing it to a Reanimated API

                                                                       // auto anonymousView = [bridge.uiManager viewForReactTag:[NSNumber numberWithDouble:viewTag]];
                                                                       // auto view = static_cast<CameraView*>(anonymousView);
                                                                       // view.frameProcessor = convertJSIFunctionToCallback(runtime, worklet);

                                                                       // TODO: Spawn thread with vision::NativeReanimatedModule::spawnThread(...) from Karol's PR

                                                                       return jsi::Value::undefined();
                                                                   });
    jsiRuntime.global().setProperty(jsiRuntime, "setFrameProcessor", std::move(setFrameProcessor));

    // unsetFrameProcessor(viewTag: number)
    auto unsetFrameProcessor = jsi::Function::createFromHostFunction(jsiRuntime,
                                                                     jsi::PropNameID::forAscii(jsiRuntime, "unsetFrameProcessor"),
                                                                     1,  // viewTag
                                                                     [](jsi::Runtime& runtime, const jsi::Value& thisValue, const jsi::Value* arguments, size_t count) -> jsi::Value {
                                                                         if (!arguments[0].isNumber()) throw jsi::JSError(runtime, "Camera::unsetFrameProcessor: First argument ('viewTag') must be a number!");
                                                                         auto viewTag = arguments[0].asNumber();

                                                                         // auto anonymousView = [bridge.uiManager viewForReactTag:[NSNumber numberWithDouble:viewTag]];
                                                                         // auto view = static_cast<CameraView*>(anonymousView);
                                                                         // view.frameProcessor = nil;

                                                                         return jsi::Value::undefined();
                                                                     });
    jsiRuntime.global().setProperty(jsiRuntime, "unsetFrameProcessor", std::move(unsetFrameProcessor));
}

void uninstall() {
    frameProcessorRuntime.reset();
}

extern "C"
JNIEXPORT void JNICALL
Java_com_mrousavy_camera_CameraViewModule_installFrameProcessorBindings(JNIEnv *env, jobject clazz, jlong jsiPtr) {
    auto runtime = reinterpret_cast<jsi::Runtime*>(jsiPtr);
    install(*runtime);
}

extern "C"
JNIEXPORT void JNICALL
Java_com_mrousavy_camera_CameraViewModule_uninstallFrameProcessorBindings(JNIEnv *env, jobject clazz) {
    uninstall();
}
