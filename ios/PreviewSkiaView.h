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

@interface PreviewSkiaView: NSObject

// The actual Skia Canvas
@property (readonly) UIView* view;

// Call to pass a new Frame to be drawn by the Skia Canvas
- (void) captureOutput:(CMSampleBufferRef)buffer;

@end


#endif /* PreviewSkiaView_h */
