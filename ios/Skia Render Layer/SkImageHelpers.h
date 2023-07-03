//
//  SkImageHelpers.h
//  VisionCamera
//
//  Created by Marc Rousavy on 23.11.22.
//  Copyright © 2022 mrousavy. All rights reserved.
//

#ifndef SkImageHelpers_h
#define SkImageHelpers_h

#import <Foundation/Foundation.h>
#import <AVFoundation/AVFoundation.h>
#import <MetalKit/MetalKit.h>

#import <include/gpu/GrRecordingContext.h>

#import "SkImage.h"
#import "SkSize.h"
#import "SkRect.h"

class SkImageHelpers {
public:
  SkImageHelpers() = delete;
  
public:
  /**
   Convert a CMSampleBuffer to an SkImage. Format has to be RGB.
   */
  static sk_sp<SkImage> convertCMSampleBufferToSkImage(GrRecordingContext* context, CMSampleBufferRef sampleBuffer);
  /**
   Convert a MTLTexture to an SkImage. Format has to be RGB.
   */
  static sk_sp<SkImage> convertMTLTextureToSkImage(GrRecordingContext* context, id<MTLTexture> mtlTexture);
  /**
   Creates a Center Crop Transformation Rect so that the source rect fills (aspectRatio: cover) the destination rect.
   The return value should be passed as a sourceRect to a canvas->draw...Rect(..) function, destinationRect should stay the same.
   */
  static SkRect createCenterCropRect(SkRect source, SkRect destination);
  
private:
  static SkRect inscribe(SkSize size, SkRect rect);
};

#endif /* SkImageHelpers_h */
