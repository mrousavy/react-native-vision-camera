//
//  PixelFormat.m
//  VisionCamera
//
//  Created by Marc Rousavy on 16.01.24.
//  Copyright © 2024 mrousavy. All rights reserved.
//

#import "PixelFormat.h"
#import <AVFoundation/AVFoundation.h>
#import <Foundation/Foundation.h>

@implementation PixelFormatUtils

+ (PixelFormat)pixelFormatForJSValue:(NSString*)string error:(NSError**)error __attribute__((swift_error(nonnull_error))) {
  if ([string isEqualToString:@"yuv"]) {
    return kPixelFormat_yuv;
  } else if ([string isEqualToString:@"rgb"]) {
    return kPixelFormat_rgb;
  } else if ([string isEqualToString:@"native"]) {
    return kPixelFormat_native;
  } else if ([string isEqualToString:@"unknown"]) {
    return kPixelFormat_unknown;
  } else {
    *error = [NSError errorWithDomain:@"PixelFormatParserError" code:1 userInfo:nil];
    return kPixelFormat_unknown;
  }
}

+ (PixelFormat)pixelFormatForMediaType:(FourCharCode)mediaSubType {
  switch (mediaSubType) {
    case kCVPixelFormatType_420YpCbCr8BiPlanarFullRange:
    case kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange:
    case kCVPixelFormatType_420YpCbCr10BiPlanarFullRange:
    case kCVPixelFormatType_420YpCbCr10BiPlanarVideoRange:
    case kCVPixelFormatType_Lossy_420YpCbCr8BiPlanarFullRange:
    case kCVPixelFormatType_Lossy_420YpCbCr8BiPlanarVideoRange:
    case kCVPixelFormatType_Lossy_420YpCbCr10PackedBiPlanarVideoRange:
      return kPixelFormat_yuv;
    case kCVPixelFormatType_32BGRA:
    case kCVPixelFormatType_Lossy_32BGRA:
      return kPixelFormat_rgb;
    default:
      return kPixelFormat_unknown;
  }
}

+ (NSString*)stringForPixelFormat:(PixelFormat)pixelFormat {
  switch (pixelFormat) {
    case kPixelFormat_yuv:
      return @"yuv";
    case kPixelFormat_rgb:
      return @"rgb";
    case kPixelFormat_native:
      return @"native";
    case kPixelFormat_unknown:
    default:
      return @"unknown";
  }
}

@end
