//
// Created by Marc Rousavy on 31.08.23.
//

#pragma once

#include <jsi/jsi.h>
#include "FrameHostObject.h"
#include "JFrame.h"

#include <SkCanvas.h>
#include <JsiSkCanvas.h>

namespace vision {

using namespace facebook;

class JSI_EXPORT DrawableFrameHostObject: public FrameHostObject {
public:
  explicit DrawableFrameHostObject(const jni::alias_ref<JFrame::javaobject>& frame,
                                   std::shared_ptr<RNSkia::JsiSkCanvas> canvas): FrameHostObject(frame), _canvas(canvas) {}

public:
  jsi::Value get(jsi::Runtime&, const jsi::PropNameID& name) override;
  std::vector<jsi::PropNameID> getPropertyNames(jsi::Runtime& rt) override;

  void invalidateCanvas();

private:
  std::shared_ptr<RNSkia::JsiSkCanvas> _canvas;
};

} // namespace vision
