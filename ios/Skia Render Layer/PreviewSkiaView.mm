//
//  PreviewSkiaView.mm
//  VisionCamera
//
//  Created by Marc Rousavy on 17.11.22.
//  Copyright © 2022 mrousavy. All rights reserved.
//

#import "PreviewSkiaView.h"
#import <Foundation/Foundation.h>

#import "SkiaMetalCanvasProvider.h"

#include <exception>
#include <string>

@implementation PreviewSkiaView {
  std::shared_ptr<SkiaMetalCanvasProvider> _canvasProvider;
}

- (void)drawFrame:(CMSampleBufferRef)buffer {
  if (_canvasProvider == nullptr) {
    throw std::runtime_error("Cannot draw new Frame to Canvas when SkiaMetalCanvasProvider is null!");
  }

  _canvasProvider->renderFrameToCanvas(buffer, [](SkCanvas* canvas) {
    // TODO: Call Frame Processor
    NSLog(@"TODO: Call Frame Processor with Canvas here!");
  });
  // TODO: Update view
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
      _canvasProvider = std::make_shared<SkiaMetalCanvasProvider>([]() {
        // TODO: Implement redraw view
        NSLog(@"TODO: Redraw View!!");
      });

      [self.layer addSublayer: _canvasProvider->getLayer()];
    }
  }
}

@end

