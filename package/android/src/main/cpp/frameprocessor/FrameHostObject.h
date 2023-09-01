//
// Created by Marc on 19/06/2021.
//

#pragma once

#include <fbjni/fbjni.h>
#include <jni.h>
#include <jsi/jsi.h>
#include <string>
#include <vector>

#include "JFrame.h"

namespace vision {

using namespace facebook;

class JSI_EXPORT FrameHostObject : public jsi::HostObject {
public:
  explicit FrameHostObject(const jni::alias_ref<JFrame::javaobject>& frame);
  ~FrameHostObject();

public:
  jsi::Value get(jsi::Runtime&, const jsi::PropNameID& name) override;
  std::vector<jsi::PropNameID> getPropertyNames(jsi::Runtime& rt) override;

public:
  jni::global_ref<JFrame> frame;
};

} // namespace vision
