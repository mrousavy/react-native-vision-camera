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

#if VISION_CAMERA_ENABLE_SKIA
#import "SkCanvas.h"
#import "JsiSkCanvas.h"
#endif

using namespace facebook;

class JSI_EXPORT FrameHostObject: public jsi::HostObject {
public:
  explicit FrameHostObject(Frame* frame): frame(frame) {}
#if VISION_CAMERA_ENABLE_SKIA
  explicit FrameHostObject(Frame* frame,
                           std::shared_ptr<RNSkia::JsiSkCanvas> canvas):
                            frame(frame), canvas(canvas) {}
#endif

public:
  jsi::Value get(jsi::Runtime&, const jsi::PropNameID& name) override;
  std::vector<jsi::PropNameID> getPropertyNames(jsi::Runtime& rt) override;

public:
  Frame* frame;
#if VISION_CAMERA_ENABLE_SKIA
  std::shared_ptr<RNSkia::JsiSkCanvas> canvas;
#endif
};
