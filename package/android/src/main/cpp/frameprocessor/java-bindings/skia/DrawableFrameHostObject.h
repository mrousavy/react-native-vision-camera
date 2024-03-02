//
// Created by Marc Rousavy on 02.03.24.
//

#pragma once

#include "FrameHostObject.h"
#include <fbjni/fbjni.h>
#include <react-native-skia/JsiSkCanvas.h>

namespace vision {

class DrawableFrameHostObject: public FrameHostObject {
public:
    DrawableFrameHostObject(const jni::alias_ref<JFrame>& frame): FrameHostObject(frame) { }

public:
    jsi::Value get(jsi::Runtime &, const jsi::PropNameID &name) override;
    std::vector<jsi::PropNameID> getPropertyNames(jsi::Runtime &rt) override;

    void setCanvas(std::shared_ptr<RNSkia::JsiSkCanvas> skiaCanvas);

private:
    std::shared_ptr<RNSkia::JsiSkCanvas> _skiaCanvas;
};

} // vision
