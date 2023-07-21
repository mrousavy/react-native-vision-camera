//
// Created by Marc Rousavy on 21.07.23.
//

#pragma once

#include <jsi/jsi.h>
#include "java-bindings/JFrameProcessorPlugin.h"
#include <memory>
#include <ReactCommon/CallInvoker.h>
#include <fbjni/fbjni.h>
#include <vector>

namespace vision {

using namespace facebook;

class FrameProcessorPluginHostObject: public jsi::HostObject {
 public:
  explicit FrameProcessorPluginHostObject(jni::alias_ref<JFrameProcessorPlugin::javaobject> plugin):
            _plugin(make_global(plugin)) { }
  ~FrameProcessorPluginHostObject() { }

 public:
  std::vector<jsi::PropNameID> getPropertyNames(jsi::Runtime& runtime) override;
  jsi::Value get(jsi::Runtime& runtime, const jsi::PropNameID& name) override;

 private:
  jni::global_ref<JFrameProcessorPlugin::javaobject> _plugin;
};

} // namespace vision
