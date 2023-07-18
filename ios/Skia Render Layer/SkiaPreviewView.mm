//
//  SkiaPreviewView.mm
//  VisionCamera
//
//  Created by Marc Rousavy on 17.11.22.
//  Copyright © 2022 mrousavy. All rights reserved.
//

#import "SkiaPreviewView.h"
#import <Foundation/Foundation.h>

#import "SkiaCanvas.h"
#import "SkiaMetalCanvasProvider.h"
#import <include/core/SkCanvas.h>

#import <exception>
#import <string>

@implementation SkiaPreviewView {
  std::shared_ptr<SkiaMetalCanvasProvider> _canvasProvider;
  SkiaFrameProcessor* _frameProcessor;
}

- (void)setFrameProcessor:(FrameProcessor* _Nonnull)frameProcessor {
  if (![frameProcessor isKindOfClass:[SkiaFrameProcessor class]]) {
    throw std::runtime_error("Tried to use SkiaPreviewView with a normal Frame Processor! You need a Skia Frame Processor for that.");
  }
  _frameProcessor = (SkiaFrameProcessor*)frameProcessor;
  if (_canvasProvider != nullptr) {
    _canvasProvider->setSkiaFrameProcessor(_frameProcessor);
  }
}

- (void) willMoveToSuperview:(UIView *)newWindow {
  if (newWindow == NULL) {
    // Remove implementation view when the parent view is not set
    if (_canvasProvider != nullptr) {
      [_canvasProvider->getLayer() removeFromSuperlayer];
      _canvasProvider = nullptr;
    }
  } else {
    // Create implementation view when the parent view is set
    if (_canvasProvider == nullptr) {
      _canvasProvider = std::make_shared<SkiaMetalCanvasProvider>();
      [self.layer addSublayer:_canvasProvider->getLayer()];
      _canvasProvider->start();
      if (_frameProcessor != nil) {
        _canvasProvider->setSkiaFrameProcessor(_frameProcessor);
      }
    }
  }
}

- (void) layoutSubviews {
  if (_canvasProvider != nullptr) {
    _canvasProvider->setSize(self.bounds.size.width, self.bounds.size.height);
  }
}

@end

