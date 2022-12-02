//
//  PreviewSkiaView.h
//  VisionCamera
//
//  Created by Marc Rousavy on 17.11.22.
//  Copyright © 2022 mrousavy. All rights reserved.
//

#ifndef PreviewSkiaView_h
#define PreviewSkiaView_h

#import <UIKit/UIKit.h>
#import <AVFoundation/AVFoundation.h>
#import "FrameProcessorCallback.h"

#import <React/RCTDefines.h>

// 1 = show FPS counter in Skia Preview, 0 = don't
#ifdef DEBUG && RCT_DEV
#define SHOW_FPS 1
#endif

typedef void (^DrawCallback) (void* _Nonnull skCanvas);

@interface PreviewSkiaView: UIView

- (instancetype)initWithFrame:(CGRect)frame;

// Call to pass a new Frame to be drawn by the Skia Canvas
- (void) drawFrame:(_Nonnull CMSampleBufferRef)buffer withCallback:(DrawCallback _Nonnull)callback;

@end


#endif /* PreviewSkiaView_h */
