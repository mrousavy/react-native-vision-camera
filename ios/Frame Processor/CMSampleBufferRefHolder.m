//
//  CMSampleBufferRefHolder.m
//  VisionCamera
//
//  Created by Marc Rousavy on 08.06.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

#import "CMSampleBufferRefHolder.h"
#import <Foundation/Foundation.h>
#import <CoreMedia/CMSampleBuffer.h>

@implementation CMSampleBufferRefHolder

- (instancetype) initWithBuffer:(CMSampleBufferRef)buffer {
  self = [super init];
  if (self) {
    self.buffer = buffer;
  }
  return self;
}

@synthesize buffer;

@end
