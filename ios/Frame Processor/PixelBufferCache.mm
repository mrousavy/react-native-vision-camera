//
//  PixelBufferCache.mm
//  VisionCamera
//
//  Created by Marc Rousavy on 29.07.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

#import "PixelBufferCache.h"

#import <Foundation/Foundation.h>

namespace vision {
  
PixelBufferCache::~PixelBufferCache() {
  if (pixelBuffer != nil) {
    CFRelease(pixelBuffer);
  }
}

uint8_t* PixelBufferCache::getPixelBuffer() {
  if (pixelBuffer == nil) {
    auto imageBuffer = CMSampleBufferGetImageBuffer(frame.buffer);
    CVPixelBufferLockBaseAddress(imageBuffer, 0);
    void* buffer = CVPixelBufferGetBaseAddress(imageBuffer);
    CVPixelBufferUnlockBaseAddress(imageBuffer, 0);
    pixelBuffer = (uint8_t*)buffer;
  }
  return pixelBuffer;
}

size_t PixelBufferCache::getPixelBufferSize() {
  if (pixelBufferSize == -1) {
    auto imageBuffer = CMSampleBufferGetImageBuffer(frame.buffer);
    size_t bytesPerRow = CVPixelBufferGetBytesPerRow(imageBuffer);
    size_t height = CVPixelBufferGetHeight(imageBuffer);
    pixelBufferSize = bytesPerRow * height;
  }
  return pixelBufferSize;
}

}
