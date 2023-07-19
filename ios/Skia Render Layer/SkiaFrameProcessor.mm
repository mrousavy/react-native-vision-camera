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

@implementation SkiaFrameProcessor

- (instancetype)init {
  if (self = [super init]) {
    // TODO: init?
  }
  return self;
}

- (void)call:(Frame*)frame {
  // TODO: Get SkiaRenderer somehow...
  SkiaRenderer* renderer = nil;
  [renderer renderCameraFrameToOffscreenCanvas:frame.buffer withDrawCallback:^(SkiaCanvas _Nonnull) {
    // TODO: Pass SkiaCanvas along here...
    [super call:frame];
  }];
}

@end
