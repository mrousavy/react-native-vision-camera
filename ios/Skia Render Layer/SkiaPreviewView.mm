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
}

- (void)drawFrame:(Frame* _Nonnull)frame withFrameProcessor:(FrameProcessorCallback _Nullable)frameProcessor {
  if (_canvasProvider == nullptr) {
    NSLog(@"VisionCamera: Dropped a Frame because SkiaPreviewView is not yet fully initialized!");
    return;
  }

  _canvasProvider->renderFrameToCanvas(frame.buffer, ^(SkCanvas* canvas) {
    if (frameProcessor != nil) {
      frameProcessor(frame, (void*)canvas);
    }
  });
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
      [self.layer addSublayer: _canvasProvider->getLayer()];
      _canvasProvider->start();
    }
  }
}

- (void) layoutSubviews {
  if (_canvasProvider != nullptr) {
    _canvasProvider->setSize(self.bounds.size.width, self.bounds.size.height);
  }
}

@end

