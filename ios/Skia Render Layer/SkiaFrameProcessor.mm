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

#import <memory>

#import <jsi/jsi.h>
#import "DrawableFrameHostObject.h"

#import <react-native-skia/JsiSkCanvas.h>
#import <react-native-skia/RNSkiOSPlatformContext.h>

using namespace facebook;

@implementation SkiaFrameProcessor {
  SkiaRenderer* _skiaRenderer;
  std::shared_ptr<RNSkia::JsiSkCanvas> _skiaCanvas;
}

- (instancetype _Nonnull)initWithWorklet:(std::shared_ptr<RNWorklet::JsiWorkletContext>)context
                                 worklet:(std::shared_ptr<RNWorklet::JsiWorklet>)worklet
                            skiaRenderer:(SkiaRenderer* _Nonnull)skiaRenderer {
  if (self = [super initWithWorklet:context
                            worklet:worklet]) {
    _skiaRenderer = skiaRenderer;
    auto platformContext = std::make_shared<RNSkia::RNSkiOSPlatformContext>(context->getJsRuntime(),
                                                                            RCTBridge.currentBridge);
    _skiaCanvas = std::make_shared<RNSkia::JsiSkCanvas>(platformContext);
  }
  return self;
}

- (void)call:(Frame*)frame {
  [_skiaRenderer renderCameraFrameToOffscreenCanvas:frame.buffer
                                   withDrawCallback:^(SkiaCanvas _Nonnull canvas) {
    // Create the Frame Host Object wrapping the internal Frame and Skia Canvas
    self->_skiaCanvas->setCanvas(static_cast<SkCanvas*>(canvas));
    auto frameHostObject = std::make_shared<DrawableFrameHostObject>(frame, self->_skiaCanvas);
    
    // Call JS Frame Processor
    [self callWithFrameHostObject:frameHostObject];
    
    // Remove Skia Canvas from Host Object because it is no longer valid
    frameHostObject->invalidateCanvas();
  }];
}

@end
