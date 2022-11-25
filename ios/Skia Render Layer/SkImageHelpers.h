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
#import "SkImage.h"
#import "SkSize.h"
#import "SkRect.h"

class SkImageHelpers {
public:
  explicit SkImageHelpers(id<MTLDevice> metalDevice, sk_sp<GrDirectContext> skContext);
  
public:
  /**
   Convert a CMSampleBuffer to an SkImage. Uses the internal Metal Device and Skia Context for caching and allocations.
   Supported Formats: YUV 420v, YUV 420f, YUV x420, and RGB.
   */
  sk_sp<SkImage> convertCMSampleBufferToSkImage(CMSampleBufferRef sampleBuffer);
  /**
   Creates a Center Crop Transformation Rect so that the source rect fills (aspectRatio: cover) the destination rect.
   The return value should be passed as a sourceRect to a canvas->draw...Rect(..) function, destinationRect should stay the same.
   */
  SkRect createCenterCropRect(SkRect source, SkRect destination);
  
private:
  id<MTLDevice> _metalDevice;
  sk_sp<GrDirectContext> _skContext;
  CVMetalTextureCacheRef _textureCache;
  
  SkRect inscribe(SkSize size, SkRect rect);
};

#endif /* SkImageHelpers_h */
