//
//  PixelFormat.h
//  VisionCamera
//
//  Created by Marc Rousavy on 16.01.24.
//  Copyright © 2024 mrousavy. All rights reserved.
//

#pragma once

typedef NS_ENUM(NSInteger, PixelFormat) {
  kPixelFormat_yuv NS_SWIFT_NAME(yuv), kPixelFormat_rgb NS_SWIFT_NAME(rgb), kPixelFormat_native NS_SWIFT_NAME(native), kPixelFormat_unknown NS_SWIFT_NAME(unknown) };

@interface PixelFormatUtils : NSObject

+ (PixelFormat)pixelFormatForJSValue:(NSString*)string error:(NSError**)error __attribute__((swift_error(nonnull_error)));
+ (PixelFormat)pixelFormatForMediaType:(FourCharCode)mediaSubType;
+ (NSString*)stringForPixelFormat:(PixelFormat)pixelFormat error:(NSError**)error __attribute__((swift_error(nonnull_error)));

@end
