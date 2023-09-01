//
// Created by Marc Rousavy on 31.08.23.
//

#include "DrawableFrameHostObject.h"
#include <SkCanvas.h>
#include "FrameHostObject.h"

namespace vision {

std::vector<jsi::PropNameID> DrawableFrameHostObject::getPropertyNames(jsi::Runtime& rt) {
  auto result = FrameHostObject::getPropertyNames(rt);

  // Skia - Render Frame
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("render")));

  if (_canvas != nullptr) {
    auto canvasPropNames = _canvas->getPropertyNames(rt);
    for (auto& prop : canvasPropNames) {
      result.push_back(std::move(prop));
    }
  }

  return result;
}

SkRect inscribe(SkSize size, SkRect rect) {
  auto halfWidthDelta = (rect.width() - size.width()) / 2.0;
  auto halfHeightDelta = (rect.height() - size.height()) / 2.0;
  return SkRect::MakeXYWH(rect.x() + halfWidthDelta,
                          rect.y() + halfHeightDelta, size.width(),
                          size.height());
}

jsi::Value DrawableFrameHostObject::get(jsi::Runtime& runtime, const jsi::PropNameID& propName) {
  auto name = propName.utf8(runtime);

  if (name == "render") {
    auto render = JSI_HOST_FUNCTION_LAMBDA {
        if (_canvas == nullptr) {
          throw jsi::JSError(runtime, "Trying to render a Frame without a Skia Canvas! Did you install Skia?");
        }

        throw std::runtime_error("render() is not yet implemented!");

        return jsi::Value::undefined();
    };
    return jsi::Function::createFromHostFunction(runtime, jsi::PropNameID::forUtf8(runtime, "render"), 1, render);
  }
  if (name == "isDrawable") {
    return jsi::Value(_canvas != nullptr);
  }

  if (_canvas != nullptr) {
    // If we have a Canvas, try to access the property on there.
    auto result = _canvas->get(runtime, propName);
    if (!result.isUndefined()) {
      return result;
    }
  }

  // fallback to base implementation
  return FrameHostObject::get(runtime, propName);
}

void DrawableFrameHostObject::invalidateCanvas() {
  _canvas = nullptr;
}



} // namespace vision