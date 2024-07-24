//
//  FrameHostObject.h
//  VisionCamera
//
//  Created by Marc Rousavy on 22.03.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

#pragma once

#import <CoreMedia/CMSampleBuffer.h>
#import <jsi/jsi.h>
#import <memory.h>

#import "Frame.h"

using namespace facebook;

class JSI_EXPORT FrameHostObject : public jsi::HostObject, public std::enable_shared_from_this<FrameHostObject> {
public:
  explicit FrameHostObject(Frame* frame) : _frame(frame), _baseClass(nullptr) {}

public:
  jsi::Value get(jsi::Runtime&, const jsi::PropNameID& name) override;
  std::vector<jsi::PropNameID> getPropertyNames(jsi::Runtime& rt) override;

public:
  inline Frame* getFrame() const noexcept {
    return _frame;
  }

private:
  Frame* _frame;
  std::unique_ptr<jsi::Object> _baseClass;
};
