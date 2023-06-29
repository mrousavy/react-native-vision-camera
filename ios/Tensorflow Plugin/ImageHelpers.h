//
//  ImageHelpers.h
//  VisionCamera
//
//  Created by Marc Rousavy on 29.06.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

#pragma once

#import <Accelerate/Accelerate.h>

class ImageHelpers {
public:
  /**
   Crop the given image to the target rectangle. This uses pointer arithmetic and does not do any copies.
   */
  static vImage_Buffer vImageCropBuffer(vImage_Buffer buf, CGRect where, size_t pixelBytes);
};
