//
// Created by Marc Rousavy on 02.03.24.
//

#include "DrawableFrameHostObject.h"
#include <react-native-skia/include/core/SkImage.h>
#include <react-native-skia/include/android/SkImageAndroid.h>

namespace vision {

void DrawableFrameHostObject::setCanvas(std::shared_ptr<RNSkia::JsiSkCanvas> skiaCanvas) {
    _skiaCanvas = skiaCanvas;
}

std::vector<jsi::PropNameID> DrawableFrameHostObject::getPropertyNames(jsi::Runtime& runtime) {
    // 1. prop names from Frame
    auto frameProps = FrameHostObject::getPropertyNames(runtime);
    // 2. prop names from Canvas
    if (_skiaCanvas != nullptr) {
        auto canvasProps = _skiaCanvas->getPropertyNames(runtime);
        frameProps.insert(frameProps.end(),
                          std::make_move_iterator(canvasProps.begin()),
                          std::make_move_iterator(canvasProps.end()));
    }
    // 3. render() function
    frameProps.push_back(jsi::PropNameID::forUtf8(runtime, "render"));

    return frameProps;
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
            SkCanvas* canvas = this->_skiaCanvas->getCanvas();
            if (canvas == nullptr) {
                throw jsi::JSError(runtime, "Failed to render Frame - the Skia canvas was already detached!");
            }

#if __ANDROID_API__ >= 26
            AHardwareBuffer* hardwareBuffer = this->frame->getHardwareBuffer();
            sk_sp<SkImage> image = SkImages::DeferredFromAHardwareBuffer(hardwareBuffer);

            if (count > 0) {
                // User passed a custom paint (e.g. shader) object to draw the Image with
                SkSamplingOptions options(SkFilterMode::kLinear, SkMipmapMode::kLinear);
                auto paintHostObject = args[0].asObject(runtime).asHostObject<RNSkia::JsiSkPaint>(runtime);
                auto paint = paintHostObject->getObject();
                canvas->drawImage(image, 0, 0, options, paint.get());
            } else {
                // User just wants to render the image
                canvas->drawImage(image, 0, 0);
            }

            return jsi::Value::undefined();
#else
            throw std::runtime_error("Skia Frame Processors are not available on "
                                     "Android API " + std::to_string(__ANDROID_API__) + "! "
                                     "Set your minSdk to 26 or higher to render using Skia.");
#endif
        };
        return jsi::Function::createFromHostFunction(runtime,
                                                     jsi::PropNameID::forUtf8(runtime, "render"),
                                                     1,
                                                     render);
    }

    return jsi::Value::undefined();
}



} // vision