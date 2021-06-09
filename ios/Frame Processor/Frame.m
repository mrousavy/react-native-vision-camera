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

@implementation Frame

- (instancetype) initWithBuffer:(CMSampleBufferRef)buffer {
  self = [super init];
  if (self) {
    self.buffer = buffer;
  }
  return self;
}

@synthesize buffer;

@end
