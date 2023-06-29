//
//  ImageHelpers.mm
//  VisionCamera
//
//  Created by Marc Rousavy on 29.06.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

#include "ImageHelpers.h"

#define AdvancePtr( _ptr, _bytes) (__typeof__(_ptr))((uintptr_t)(_ptr) + (size_t)(_bytes))

vImage_Buffer ImageHelpers::vImageCropBuffer(vImage_Buffer buf, CGRect where, size_t pixelBytes) {
  // from https://stackoverflow.com/a/74699324/5281431
  return (vImage_Buffer) {
    .data = AdvancePtr(buf.data, where.origin.y * buf.rowBytes + where.origin.x * pixelBytes),
    .height = (unsigned long) where.size.height,
    .width = (unsigned long) where.size.width,
    .rowBytes = buf.rowBytes
  };
}
