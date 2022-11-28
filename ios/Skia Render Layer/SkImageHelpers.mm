//
//  CMSampleBuffer+toSkImage.m
//  VisionCamera
//
//  Created by Marc Rousavy on 23.11.22.
//  Copyright © 2022 mrousavy. All rights reserved.
//

#import "SkImageHelpers.h"
#import <AVFoundation/AVFoundation.h>
#import <Metal/Metal.h>

#import <include/core/SkColorSpace.h>
#import <include/core/SkSurface.h>
#import <include/core/SkCanvas.h>
#import <include/core/SkData.h>

#include <TargetConditionals.h>
#if TARGET_RT_BIG_ENDIAN
#   define FourCC2Str(fourcc) (const char[]){*((char*)&fourcc), *(((char*)&fourcc)+1), *(((char*)&fourcc)+2), *(((char*)&fourcc)+3),0}
#else
#   define FourCC2Str(fourcc) (const char[]){*(((char*)&fourcc)+3), *(((char*)&fourcc)+2), *(((char*)&fourcc)+1), *(((char*)&fourcc)+0),0}
#endif

sk_sp<SkImage> SkImageHelpers::convertCMSampleBufferToSkImage(CMSampleBufferRef sampleBuffer) {
  auto pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer);
  
  auto format = CVPixelBufferGetPixelFormatType(pixelBuffer);
  
  if (format != kCVPixelFormatType_32BGRA) {
    auto fourCharCode = @(FourCC2Str(format));
    auto error = std::string("VisionCamera: Frame has unknown Pixel Format (") + fourCharCode.UTF8String + std::string(") - cannot convert to SkImage!");
    throw std::runtime_error(error);
  }
  
  // RGB (BGRA 8888)
  // [B G R A B G R A B G R A B G R A]
  auto srcBuff = CVPixelBufferGetBaseAddress(pixelBuffer);
  auto bytesPerRow = CVPixelBufferGetBytesPerRow(pixelBuffer);
  double width = CVPixelBufferGetWidth(pixelBuffer);
  double height = CVPixelBufferGetHeight(pixelBuffer);
  auto info = SkImageInfo::Make(width,
                                height,
                                kBGRA_8888_SkColorType,
                                kOpaque_SkAlphaType);
  auto data = SkData::MakeWithoutCopy(srcBuff, bytesPerRow * height);
  auto image = SkImage::MakeRasterData(info, data, bytesPerRow);
  return image;
}

SkRect SkImageHelpers::createCenterCropRect(SkRect sourceRect, SkRect destinationRect) {
  SkSize src;
  if (destinationRect.width() / destinationRect.height() > sourceRect.width() / sourceRect.height()) {
    src = SkSize::Make(sourceRect.width(), (sourceRect.width() * destinationRect.height()) / destinationRect.width());
  } else {
    src = SkSize::Make((sourceRect.height() * destinationRect.width()) / destinationRect.height(), sourceRect.height());
  }
  
  return inscribe(src, sourceRect);
}

SkRect SkImageHelpers::inscribe(SkSize size, SkRect rect) {
  auto halfWidthDelta = (rect.width() - size.width()) / 2.0;
  auto halfHeightDelta = (rect.height() - size.height()) / 2.0;
  return SkRect::MakeXYWH(rect.x() + halfWidthDelta,
                          rect.y() + halfHeightDelta,
                          size.width(),
                          size.height());
}

