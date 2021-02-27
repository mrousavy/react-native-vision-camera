//
//  FrameProcessorHolder.m
//  VisionCamera
//
//  Created by Marc Rousavy on 27.02.21.
//  Copyright © 2021 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "FrameProcessorHolder.h"

@implementation FrameProcessorHolder

@synthesize dispatchQueue;

- (instancetype)init
{
  self = [super init];
  if (self) {
    // TODO: relativePriority 0 or -1?
    dispatch_queue_attr_t qos = dispatch_queue_attr_make_with_qos_class(DISPATCH_QUEUE_SERIAL, QOS_CLASS_USER_INTERACTIVE, -1);
    dispatchQueue = dispatch_queue_create("com.mrousavy.camera-frame-processor", qos);
  }
  return self;
}

@end
