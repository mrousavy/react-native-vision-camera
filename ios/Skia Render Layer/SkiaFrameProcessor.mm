//
//  SkiaFrameProcessor.mm
//  VisionCamera
//
//  Created by Marc Rousavy on 14.07.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "SkiaFrameProcessor.h"
#import "SkiaRenderer.h"

@implementation SkiaFrameProcessor {
  SkiaRenderer* _skiaRenderer;
}

- (instancetype _Nonnull)initWithWorklet:(std::shared_ptr<RNWorklet::JsiWorkletContext>)context
                                 worklet:(std::shared_ptr<RNWorklet::JsiWorklet>)worklet
                            skiaRenderer:(SkiaRenderer * _Nonnull)skiaRenderer {
  if (self = [super initWithWorklet:context worklet:worklet]) {
    _skiaRenderer = skiaRenderer;
  }
  return self;
}

- (void)call:(Frame*)frame {
  [_skiaRenderer renderCameraFrameToOffscreenCanvas:frame.buffer
                                   withDrawCallback:^(SkiaCanvas _Nonnull) {
    // TODO: Pass SkiaCanvas along here...
    [super call:frame];
  }];
}

@end
