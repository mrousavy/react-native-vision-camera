//
//  FrameHostObject.h
//  VisionCamera
//
//  Created by Marc Rousavy on 22.03.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

#pragma once

#import <jsi/jsi.h>
#import <CoreMedia/CMSampleBuffer.h>

using namespace facebook;

class JSI_EXPORT FrameHostObject: public jsi::HostObject {
public:
  explicit FrameHostObject(CMSampleBufferRef buffer): buffer(buffer) {}
  ~FrameHostObject();

public:
  jsi::Value get(jsi::Runtime&, const jsi::PropNameID& name) override;
  std::vector<jsi::PropNameID> getPropertyNames(jsi::Runtime& rt) override;
  void destroyBuffer();
  
public:
  CMSampleBufferRef buffer;
};
