//
//  PreviewView.h
//  VisionCamera
//
//  Created by Marc Rousavy on 07.07.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

#pragma once

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import <AVFoundation/AVFoundation.h>
#import "Frame.h"
#import "FrameProcessorCallback.h"

@interface PreviewView : UIView

// Call to pass a new Frame
- (void) drawFrame:(Frame* _Nonnull)frame withFrameProcessor:(FrameProcessorCallback _Nullable)frameProcessor;

@end

@implementation PreviewView

- (void) drawFrame:(Frame* _Nonnull)frame withFrameProcessor:(FrameProcessorCallback _Nullable)frameProcessor {
  [NSException raise:NSInternalInconsistencyException
              format:@"You must override %@ in a subclass", NSStringFromSelector(_cmd)];
}

@end
