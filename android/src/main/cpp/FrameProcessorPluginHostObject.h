//
// Created by Marc Rousavy on 21.07.23.
//

#pragma once

#include <jsi/jsi.h>
#include "java-bindings/JFrameProcessorPlugin.h"
#include <memory>
#include <ReactCommon/CallInvoker.h>
#include <fbjni/fbjni.h>

namespace vision {

using namespace facebook;

class FrameProcessorPluginHostObject: public jsi::HostObject {
public:
    explicit FrameProcessorPluginHostObject(jni::global_ref<vision::JFrameProcessorPlugin::javaobject> plugin):
            _plugin(plugin) { }
    ~FrameProcessorPluginHostObject() { }

public:
    std::vector<jsi::PropNameID> getPropertyNames(jsi::Runtime& runtime) override;
    jsi::Value get(jsi::Runtime& runtime, const jsi::PropNameID& name) override;

private:
    jni::global_ref<vision::JFrameProcessorPlugin::javaobject> _plugin;
};

} // namespace vision