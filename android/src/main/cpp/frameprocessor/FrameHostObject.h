//
// Created by Marc on 19/06/2021.
//

#pragma once

#include <jsi/jsi.h>
#include <jni.h>
#include <fbjni/fbjni.h>
#include <vector>
#include <string>

#include "JFrame.h"

namespace vision {

using namespace facebook;

class JSI_EXPORT FrameHostObject : public jsi::HostObject {
 public:
  explicit FrameHostObject(const jni::alias_ref<JFrame::javaobject>& frame);
  ~FrameHostObject();

 public:
  jsi::Value get(jsi::Runtime &, const jsi::PropNameID &name) override;
  std::vector<jsi::PropNameID> getPropertyNames(jsi::Runtime &rt) override;

 public:
  jni::global_ref<JFrame> frame;

 private:
  static auto constexpr TAG = "VisionCamera";
};

} // namespace vision
