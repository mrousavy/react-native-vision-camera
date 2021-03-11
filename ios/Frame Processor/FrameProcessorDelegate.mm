//
//  FrameProcessorDelegate.mm
//  VisionCamera
//
//  Created by Marc Rousavy on 27.02.21.
//  Copyright © 2021 Facebook. All rights reserved.
//

#import "FrameProcessorDelegate.h"
#import <Foundation/Foundation.h>

//using namespace reanimated;

@implementation FrameProcessorDelegate {
  FrameProcessorCallback frameProcessorCallback;
}

@synthesize dispatchQueue;

- (instancetype) initWithDispatchQueue:(dispatch_queue_t)dispatchQueue {
  self = [super init];
  if (self) {
    NSLog(@"FrameProcessorDelegate: init()");
    self.dispatchQueue = dispatchQueue;
  }
  return self;
}

- (void)dealloc {
  NSLog(@"FrameProcessorDelegate: dealloc()");
}

- (void) setFrameProcessor:(FrameProcessorCallback)frameProcessor {
  NSLog(@"FrameProcessorDelegate: Setting frame processor function!");
  frameProcessorCallback = frameProcessor;
}

- (void) captureOutput:(AVCaptureOutput *)output didOutputSampleBuffer:(CMSampleBufferRef)sampleBuffer fromConnection:(AVCaptureConnection *)connection {
  NSLog(@"FrameProcessorDelegate: Camera frame arrived");
  // TODO: Call [worklet] with the actual frame output buffer
  
  frameProcessorCallback(42);
}

@end
