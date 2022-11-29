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

typedef void (^DrawCallback) (void* _Nonnull skCanvas);

@interface PreviewSkiaView: UIView

// Call to pass a new Frame to be drawn by the Skia Canvas
- (void) drawFrame:(_Nonnull CMSampleBufferRef)buffer withCallback:(DrawCallback _Nonnull)callback;

@end


#endif /* PreviewSkiaView_h */
