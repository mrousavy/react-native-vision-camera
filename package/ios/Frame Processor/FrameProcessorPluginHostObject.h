//
//  FrameProcessorPluginHostObject.h
//  VisionCamera
//
//  Created by Marc Rousavy on 21.07.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

#pragma once

#import "FrameProcessorPlugin.h"
#import <ReactCommon/CallInvoker.h>
#import <jsi/jsi.h>
#import <memory>

using namespace facebook;

class FrameProcessorPluginHostObject : public jsi::HostObject {
public:
  explicit FrameProcessorPluginHostObject(FrameProcessorPlugin* plugin, std::shared_ptr<react::CallInvoker> callInvoker)
      : _plugin(plugin), _callInvoker(callInvoker) {}
  ~FrameProcessorPluginHostObject() {}

public:
  std::vector<jsi::PropNameID> getPropertyNames(jsi::Runtime& runtime) override;
  jsi::Value get(jsi::Runtime& runtime, const jsi::PropNameID& name) override;

private:
  FrameProcessorPlugin* _plugin;
  std::shared_ptr<react::CallInvoker> _callInvoker;
};
