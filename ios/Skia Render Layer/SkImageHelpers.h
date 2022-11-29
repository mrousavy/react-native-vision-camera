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
#import <CoreVideo/CVMetalTextureCache.h>
#import <Metal/MTLDevice.h>
#import <include/gpu/GrRecordingContext.h>

#import "SkImage.h"
#import "SkSize.h"
#import "SkRect.h"

class SkImageHelpers {
public:
  explicit SkImageHelpers(id<MTLDevice> device, sk_sp<GrRecordingContext> context);
  ~SkImageHelpers();
  
public:
  /**
   Convert a CMSampleBuffer to an SkImage. Format has to be RGB.
   */
  sk_sp<SkImage> convertCMSampleBufferToSkImage(CMSampleBufferRef sampleBuffer);
  /**
   Creates a Center Crop Transformation Rect so that the source rect fills (aspectRatio: cover) the destination rect.
   The return value should be passed as a sourceRect to a canvas->draw...Rect(..) function, destinationRect should stay the same.
   */
  static SkRect createCenterCropRect(SkRect source, SkRect destination);
  
private:
  static SkRect inscribe(SkSize size, SkRect rect);
  sk_sp<GrRecordingContext> _context;
  CVMetalTextureCacheRef _textureCache;
};

#endif /* SkImageHelpers_h */
