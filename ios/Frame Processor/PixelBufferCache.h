//
//  PixelBufferCache.h
//  VisionCamera
//
//  Created by Marc Rousavy on 29.07.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

#pragma once

#import "Frame.h"

namespace vision {

class PixelBufferCache {
public:
  explicit PixelBufferCache(Frame* _Nonnull frame): frame(frame) {}
  ~PixelBufferCache();
  
public:
  uint8_t* _Nonnull getPixelBuffer();
  size_t getPixelBufferSize();
  
private:
  Frame* _Nonnull frame;
  uint8_t* _Nullable pixelBuffer = nil;
  size_t pixelBufferSize = -1;
};

}
