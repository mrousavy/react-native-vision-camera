
/**
 * This code was generated by [react-native-codegen](https://www.npmjs.com/package/react-native-codegen).
 *
 * Do not edit this file as changes may cause incorrect behavior and will be lost
 * once the code is regenerated.
 *
 * @generated by codegen project: GenerateEventEmitterCpp.js
 */

#include "EventEmitters.h"


namespace facebook::react {

void CameraViewEventEmitter::onViewReady(OnViewReady $event) const {
  dispatchEvent("viewReady", [](jsi::Runtime &runtime) {
    auto $payload = jsi::Object(runtime);
    
    return $payload;
  });
}


void CameraViewEventEmitter::onAverageFpsChanged(OnAverageFpsChanged $event) const {
  dispatchEvent("averageFpsChanged", [$event=std::move($event)](jsi::Runtime &runtime) {
    auto $payload = jsi::Object(runtime);
    $payload.setProperty(runtime, "averageFps", $event.averageFps);
    return $payload;
  });
}


void CameraViewEventEmitter::onInitialized(OnInitialized $event) const {
  dispatchEvent("initialized", [](jsi::Runtime &runtime) {
    auto $payload = jsi::Object(runtime);
    
    return $payload;
  });
}


void CameraViewEventEmitter::onError(OnError $event) const {
  dispatchEvent("error", [$event=std::move($event)](jsi::Runtime &runtime) {
    auto $payload = jsi::Object(runtime);
    $payload.setProperty(runtime, "code", $event.code);
$payload.setProperty(runtime, "message", $event.message);
{
  auto cause = jsi::Object(runtime);
  cause.setProperty(runtime, "code", $event.cause.code);
  cause.setProperty(runtime, "domain", $event.cause.domain);
  cause.setProperty(runtime, "message", $event.cause.message);
  cause.setProperty(runtime, "details", $event.cause.details);
  cause.setProperty(runtime, "stacktrace", $event.cause.stacktrace);
  $payload.setProperty(runtime, "cause", cause);
}
    return $payload;
  });
}


void CameraViewEventEmitter::onCodeScanned(OnCodeScanned $event) const {
  dispatchEvent("codeScanned", [$event=std::move($event)](jsi::Runtime &runtime) {
    auto $payload = jsi::Object(runtime);
    
    auto codes = jsi::Array(runtime, $event.codes.size());
    size_t codesIndex = 0;
    for (auto codesValue : $event.codes) {
      auto codesObject = jsi::Object(runtime);
      codesObject.setProperty(runtime, "type", codesValue.type);
codesObject.setProperty(runtime, "value", codesValue.value);
{
  auto frame = jsi::Object(runtime);
  frame.setProperty(runtime, "x", codesValue,frame.x);
  frame.setProperty(runtime, "y", codesValue,frame.y);
  frame.setProperty(runtime, "width", codesValue,frame.width);
  frame.setProperty(runtime, "height", codesValue,frame.height);
  codesObject.setProperty(runtime, "frame", frame);
}

    auto corners = jsi::Array(runtime, codesValue.corners.size());
    size_t cornersIndex = 0;
    for (auto cornersValue : codesValue.corners) {
      auto cornersObject = jsi::Object(runtime);
      cornersObject.setProperty(runtime, "x", cornersValue.x);
cornersObject.setProperty(runtime, "y", cornersValue.y);
      corners.setValueAtIndex(runtime, cornersIndex++, cornersObject);
    }
    codesObject.setProperty(runtime, "corners", corners);
  
      codes.setValueAtIndex(runtime, codesIndex++, codesObject);
    }
    $payload.setProperty(runtime, "codes", codes);
  
{
  auto frame = jsi::Object(runtime);
  frame.setProperty(runtime, "width", $event.frame.width);
  frame.setProperty(runtime, "height", $event.frame.height);
  $payload.setProperty(runtime, "frame", frame);
}
    return $payload;
  });
}


void CameraViewEventEmitter::onStarted(OnStarted $event) const {
  dispatchEvent("started", [](jsi::Runtime &runtime) {
    auto $payload = jsi::Object(runtime);
    
    return $payload;
  });
}


void CameraViewEventEmitter::onStopped(OnStopped $event) const {
  dispatchEvent("stopped", [](jsi::Runtime &runtime) {
    auto $payload = jsi::Object(runtime);
    
    return $payload;
  });
}


void CameraViewEventEmitter::onPreviewStarted(OnPreviewStarted $event) const {
  dispatchEvent("previewStarted", [](jsi::Runtime &runtime) {
    auto $payload = jsi::Object(runtime);
    
    return $payload;
  });
}


void CameraViewEventEmitter::onPreviewStopped(OnPreviewStopped $event) const {
  dispatchEvent("previewStopped", [](jsi::Runtime &runtime) {
    auto $payload = jsi::Object(runtime);
    
    return $payload;
  });
}


void CameraViewEventEmitter::onShutter(OnShutter $event) const {
  dispatchEvent("shutter", [$event=std::move($event)](jsi::Runtime &runtime) {
    auto $payload = jsi::Object(runtime);
    $payload.setProperty(runtime, "type", $event.type);
    return $payload;
  });
}


void CameraViewEventEmitter::onOutputOrientationChanged(OnOutputOrientationChanged $event) const {
  dispatchEvent("outputOrientationChanged", [$event=std::move($event)](jsi::Runtime &runtime) {
    auto $payload = jsi::Object(runtime);
    $payload.setProperty(runtime, "outputOrientation", toString($event.outputOrientation));
    return $payload;
  });
}


void CameraViewEventEmitter::onPreviewOrientationChanged(OnPreviewOrientationChanged $event) const {
  dispatchEvent("previewOrientationChanged", [$event=std::move($event)](jsi::Runtime &runtime) {
    auto $payload = jsi::Object(runtime);
    $payload.setProperty(runtime, "previewOrientation", toString($event.previewOrientation));
    return $payload;
  });
}

} // namespace facebook::react
