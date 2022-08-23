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
}

- (instancetype) initWithBuffer:(CMSampleBufferRef)buffer orientation:(UIImageOrientation)orientation {
  self = [super init];
  if (self) {
    _buffer = buffer;
    _orientation = orientation;
  }
  return self;
}

/*
 Used in the case where we need to explicitly retain the sample buffer (so ARC doesn't free it).
 `releaseBuffer()` must be called to explicitly release this buffer before deinitialisation.
 */
- (instancetype) initWithBufferCopy:(CMSampleBufferRef)buffer orientation:(UIImageOrientation)orientation {
  self = [super init];
  if (self) {
    CFRetain(buffer);
    _buffer = buffer;
    _orientation = orientation;
  }
  return self;
}

- (void) releaseBuffer {
  CMSampleBufferInvalidate(_buffer);
  CFRelease(_buffer);
  buffer = NULL;
}

@synthesize buffer = _buffer;
@synthesize orientation = _orientation;

@end
