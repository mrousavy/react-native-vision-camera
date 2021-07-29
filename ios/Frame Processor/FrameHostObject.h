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
#import "Frame.h"
#import "PixelBufferCache.h"

using namespace facebook;

namespace vision {

class JSI_EXPORT FrameHostObject: public jsi::HostObject {
public:
  explicit FrameHostObject(Frame* _Nonnull frame): frame(frame), pixelBufferCache(frame) {}
  ~FrameHostObject();

public:
  jsi::Value get(jsi::Runtime&, const jsi::PropNameID& name) override;
  std::vector<jsi::PropNameID> getPropertyNames(jsi::Runtime& rt) override;
  void close();

public:
  Frame* _Nonnull frame;
  
private:
  void assertIsFrameStrong(jsi::Runtime& runtime, const std::string& accessedPropName);
  PixelBufferCache pixelBufferCache;
};

} // namespace vision
