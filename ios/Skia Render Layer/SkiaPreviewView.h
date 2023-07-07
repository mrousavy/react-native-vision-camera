//
//  SkiaPreviewView.h
//  VisionCamera
//
//  Created by Marc Rousavy on 17.11.22.
//  Copyright © 2022 mrousavy. All rights reserved.
//

#ifndef SkiaPreviewView_h
#define SkiaPreviewView_h

#import <UIKit/UIKit.h>
#import <AVFoundation/AVFoundation.h>
#import "FrameProcessorCallback.h"

typedef void (^DrawCallback) (void* _Nonnull skCanvas);

@interface SkiaPreviewView: UIView

// Call to pass a new Frame to be drawn by the Skia Canvas
- (void) drawFrame:(_Nonnull CMSampleBufferRef)buffer withCallback:(DrawCallback _Nonnull)callback;

@end


#endif /* SkiaPreviewView_h */
