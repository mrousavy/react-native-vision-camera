//
//  FrameHostObject.h
//  VisionCamera
//
//  Created by Marc Rousavy on 22.03.21.
//  Copyright © 2021 Facebook. All rights reserved.
//

#pragma once

#import "Frame.h"
#import <jsi/jsi.h>
#import <CoreMedia/CMSampleBuffer.h>

using namespace facebook;

class FrameHostObject: public Frame, public jsi::HostObject {
public:
  explicit FrameHostObject(CMSampleBufferRef buffer): Frame(buffer) {}
  
public:
  jsi::Value get(jsi::Runtime&, const jsi::PropNameID& name) override;
};
