//
// Created by Marc Rousavy on 02.03.24.
//

#include "DrawableFrameHostObject.h"

namespace vision {

void DrawableFrameHostObject::setCanvas(std::shared_ptr<RNSkia::JsiSkCanvas> skiaCanvas) {
    _skiaCanvas = skiaCanvas;
}

jsi::Value DrawableFrameHostObject::get(jsi::Runtime& runtime, const jsi::PropNameID& propNameId) {
    // Get value from super (FrameHostObject)
    auto frameValue = FrameHostObject::get(runtime, propNameId);
    if (!frameValue.isUndefined() && !frameValue.isNull()) {
        return frameValue;
    }

    // super (FrameHostObject) doesn't have that value, see if the canvas has that
    auto canvasValue = _skiaCanvas->get(runtime, propNameId);
    if (!canvasValue.isUndefined() && !canvasValue.isNull()) {
        return canvasValue;
    }

    // Neither FrameHostObject nor SkCanvas have that value, see if it is a custom value
    auto name = propNameId.utf8(runtime);
    if (name == "render") {
        jsi::HostFunctionType render = [this] (jsi::Runtime& runtime,
                                               const jsi::Value& thisVal,
                                               const jsi::Value* args,
                                               size_t count) -> jsi::Value {
            if (this->_skiaCanvas == nullptr) {
                throw jsi::JSError(runtime, "Failed to render Frame - the Skia canvas was already detached!");
            }
            // TODO: Render Image (HardwareBuffer) to Skia canvas!
            return jsi::Value::undefined();
        };
        return jsi::Function::createFromHostFunction(runtime,
                                                     jsi::PropNameID::forUtf8(runtime, "render"),
                                                     1,
                                                     render);
    }
}



} // vision