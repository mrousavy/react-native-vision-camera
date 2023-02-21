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

#import "SkCanvas.h"
#import "JsiSkCanvas.h"

using namespace facebook;

class JSI_EXPORT FrameHostObject: public jsi::HostObject {
public:
  explicit FrameHostObject(Frame* frame): frame(frame) {}
  explicit FrameHostObject(Frame* frame,
                           std::shared_ptr<RNSkia::JsiSkCanvas> canvas):
                            frame(frame), canvas(canvas) {}

public:
  jsi::Value get(jsi::Runtime&, const jsi::PropNameID& name) override;
  std::vector<jsi::PropNameID> getPropertyNames(jsi::Runtime& rt) override;

public:
  Frame* frame;
  std::shared_ptr<RNSkia::JsiSkCanvas> canvas;
};
