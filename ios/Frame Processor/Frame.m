//
//  Frame.m
//  VisionCamera
//
//  Created by Marc Rousavy on 08.06.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

#import "Frame.h"
#import <Foundation/Foundation.h>
#import <CoreMedia/CMSampleBuffer.h>

@implementation Frame {
  CMSampleBufferRef buffer;
  UIImageOrientation orientation;
  AVCaptureDeviceFormat *cameraFormat;
}

- (instancetype) initWithBuffer:(CMSampleBufferRef)buffer orientation:(UIImageOrientation)orientation cameraFormat:(AVCaptureDeviceFormat *)cameraFormat {
  self = [super init];
  if (self) {
    _buffer = buffer;
    _orientation = orientation;
    _cameraFormat = cameraFormat;
  }
  return self;
}

@synthesize buffer = _buffer;
@synthesize orientation = _orientation;
@synthesize cameraFormat = _cameraFormat;

@end
