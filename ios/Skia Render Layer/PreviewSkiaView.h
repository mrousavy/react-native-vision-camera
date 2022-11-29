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

@interface PreviewSkiaView: UIView

@property (nullable) FrameProcessorCallback frameProcessorCallback;

// Call to pass a new Frame to be drawn by the Skia Canvas
- (void) drawFrame:(_Nonnull CMSampleBufferRef)buffer;

@end


#endif /* PreviewSkiaView_h */
