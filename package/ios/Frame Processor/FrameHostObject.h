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
#import <mutex>

#import "Frame.h"

using namespace facebook;

class JSI_EXPORT FrameHostObject : public jsi::HostObject {
public:
  explicit FrameHostObject(Frame* frame) : frame(frame) {}

public:
  jsi::Value get(jsi::Runtime&, const jsi::PropNameID& name) override;
  std::vector<jsi::PropNameID> getPropertyNames(jsi::Runtime& rt) override;

public:
  Frame* frame;

private:
  Frame* getFrame();

private:
  std::mutex _mutex;
  size_t _refCount = 0;
};
