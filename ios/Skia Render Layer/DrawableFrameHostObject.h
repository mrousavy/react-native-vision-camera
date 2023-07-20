//
//  DrawableFrameHostObject.h
//  VisionCamera
//
//  Created by Marc Rousavy on 20.07.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

#pragma once

#import <jsi/jsi.h>
#import "../Frame Processor/FrameHostObject.h"
#import "../Frame Processor/Frame.h"
#import <CoreMedia/CMSampleBuffer.h>

#import "SkCanvas.h"
#import "JsiSkCanvas.h"

using namespace facebook;

class JSI_EXPORT DrawableFrameHostObject: public FrameHostObject {
public:
  explicit DrawableFrameHostObject(Frame* frame,
                                   std::shared_ptr<RNSkia::JsiSkCanvas> canvas):
                                    FrameHostObject(frame), _canvas(canvas) {}
  
public:
  jsi::Value get(jsi::Runtime&, const jsi::PropNameID& name) override;
  std::vector<jsi::PropNameID> getPropertyNames(jsi::Runtime& rt) override;
  
  void invalidateCanvas();
  
private:
  std::shared_ptr<RNSkia::JsiSkCanvas> _canvas;
};
