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

class SkImageHelpers {
public:
  explicit SkImageHelpers(id<MTLDevice> metalDevice, sk_sp<GrDirectContext> skContext);
  
public:
  sk_sp<SkImage> convertCMSampleBufferToSkImage(CMSampleBufferRef sampleBuffer);
  
private:
  id<MTLDevice> _metalDevice;
  sk_sp<GrDirectContext> _skContext;
  CVMetalTextureCacheRef _textureCache;
};

#endif /* SkImageHelpers_h */
