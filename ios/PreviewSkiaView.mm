//
//  PreviewSkiaView.mm
//  VisionCamera
//
//  Created by Marc Rousavy on 17.11.22.
//  Copyright © 2022 mrousavy. All rights reserved.
//

#import "PreviewSkiaView.h"
#import <Foundation/Foundation.h>

#include <react_native_skia/react-native-skia-umbrella.h>

@implementation PreviewSkiaView {
  SkiaUIView* skiaView;
}

- (instancetype)init
{
  self = [super init];
  if (self) {
    skiaView = [[SkiaUIView alloc] init];
  }
  return self;
}

- (void)captureOutput:(CMSampleBufferRef)buffer {
  auto iosView = skiaView.impl;
  auto drawView = iosView->getDrawView();
  // TODO: Update view
}

- (UIView*) view {
  return skiaView;
}

@end

