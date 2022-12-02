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

#if SHOW_FPS
#import <React/RCTFPSGraph.h>
#endif

@implementation PreviewSkiaView {
  std::shared_ptr<SkiaMetalCanvasProvider> _canvasProvider;
}

- (void)drawFrame:(CMSampleBufferRef)buffer withCallback:(DrawCallback _Nonnull)callback {
  if (_canvasProvider == nullptr) {
    throw std::runtime_error("Cannot draw new Frame to Canvas when SkiaMetalCanvasProvider is null!");
  }
  
  _canvasProvider->renderFrameToCanvas(buffer, ^(SkCanvas* canvas) {
    callback((void*)canvas);
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

