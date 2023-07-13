//
//  SkiaPreviewView.h
//  VisionCamera
//
//  Created by Marc Rousavy on 17.11.22.
//  Copyright © 2022 mrousavy. All rights reserved.
//

#pragma once

#import <UIKit/UIKit.h>
#import <AVFoundation/AVFoundation.h>
#import "PreviewView.h"

typedef void (^DrawCallback) (void* _Nonnull skCanvas);

@interface SkiaPreviewView: PreviewView

// Call to pass a new Frame to be drawn by the Skia Canvas
- (void) drawFrame:(_Nonnull CMSampleBufferRef)buffer;
// overload with custom draw callback
- (void) drawFrame:(_Nonnull CMSampleBufferRef)buffer withCallback:(DrawCallback _Nullable)callback;

@end
