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
#import <JsiSkCanvas.h>
#import "../Skia Render Layer/SkImageHelpers.h"

using namespace facebook;

class JSI_EXPORT FrameHostObject: public jsi::HostObject {
public:
  explicit FrameHostObject(Frame* frame): frame(frame) {}
  explicit FrameHostObject(Frame* frame,
                           std::shared_ptr<RNSkia::JsiSkCanvas> canvas,
                           SkImageHelpers* imageHelpers):
                            frame(frame), canvas(canvas), _imageHelpers(imageHelpers) {}

public:
  jsi::Value get(jsi::Runtime&, const jsi::PropNameID& name) override;
  std::vector<jsi::PropNameID> getPropertyNames(jsi::Runtime& rt) override;
  void close();
  
private:
  void assertIsFrameStrong(jsi::Runtime& runtime, const std::string& accessedPropName);

public:
  Frame* frame;
  std::shared_ptr<RNSkia::JsiSkCanvas> canvas;
  
private:
  SkImageHelpers* _imageHelpers;
};
