//
//  Frame.m
//  VisionCamera
//
//  Created by Marc Rousavy on 08.06.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

#import "Frame.h"
#import <CoreMedia/CMSampleBuffer.h>
#import <Foundation/Foundation.h>

@implementation Frame {
  CMSampleBufferRef _Nonnull _buffer;
  UIImageOrientation _orientation;
  BOOL _isMirrored;
}

- (instancetype)initWithBuffer:(CMSampleBufferRef)buffer orientation:(UIImageOrientation)orientation isMirrored:(BOOL)isMirrored {
  self = [super init];
  if (self) {
    _buffer = buffer;
    _orientation = orientation;
    _isMirrored = isMirrored;
  }
  return self;
}

- (void)incrementRefCount {
  CFRetain(_buffer);
}

- (void)decrementRefCount {
  CFRelease(_buffer);
}

- (CMSampleBufferRef)buffer {
  return _buffer;
}

- (UIImageOrientation)orientation {
  return _orientation;
}

- (NSString*)pixelFormat {
  CMFormatDescriptionRef format = CMSampleBufferGetFormatDescription(_buffer);
  FourCharCode mediaType = CMFormatDescriptionGetMediaSubType(format);
  switch (mediaType) {
    case kCVPixelFormatType_32BGRA:
    case kCVPixelFormatType_Lossy_32BGRA:
      return @"rgb";
    case kCVPixelFormatType_420YpCbCr8BiPlanarFullRange:
    case kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange:
    case kCVPixelFormatType_420YpCbCr10BiPlanarFullRange:
    case kCVPixelFormatType_420YpCbCr10BiPlanarVideoRange:
    case kCVPixelFormatType_Lossy_420YpCbCr8BiPlanarFullRange:
    case kCVPixelFormatType_Lossy_420YpCbCr8BiPlanarVideoRange:
    case kCVPixelFormatType_Lossy_420YpCbCr10PackedBiPlanarVideoRange:
      return @"yuv";
    default:
      return @"unknown";
  }
}

- (BOOL)isMirrored {
  return _isMirrored;
}

- (BOOL)isValid {
  return _buffer != nil && CMSampleBufferIsValid(_buffer);
}

- (size_t)width {
  CVPixelBufferRef imageBuffer = CMSampleBufferGetImageBuffer(_buffer);
  return CVPixelBufferGetWidth(imageBuffer);
}

- (size_t)height {
  CVPixelBufferRef imageBuffer = CMSampleBufferGetImageBuffer(_buffer);
  return CVPixelBufferGetHeight(imageBuffer);
}

- (double)timestamp {
  CMTime timestamp = CMSampleBufferGetPresentationTimeStamp(_buffer);
  return CMTimeGetSeconds(timestamp) * 1000.0;
}

- (size_t)bytesPerRow {
  CVPixelBufferRef imageBuffer = CMSampleBufferGetImageBuffer(_buffer);
  return CVPixelBufferGetBytesPerRow(imageBuffer);
}

- (size_t)planesCount {
  CVPixelBufferRef imageBuffer = CMSampleBufferGetImageBuffer(_buffer);
  return CVPixelBufferGetPlaneCount(imageBuffer);
}

@end
