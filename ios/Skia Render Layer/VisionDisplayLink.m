//
//  VisionDisplayLink.m
//  VisionCamera
//
//  Created by Marc Rousavy on 28.11.22.
//  Copyright © 2022 mrousavy. All rights reserved.
//

#import "VisionDisplayLink.h"
#import <Foundation/Foundation.h>

@implementation VisionDisplayLink

- (void)start:(block_t)block {
  self.updateBlock = block;
  // check whether the loop is already running
  if (_displayLink == nil) {
    // specify update method
    _displayLink = [CADisplayLink displayLinkWithTarget:self selector:@selector(update:)];

    // Start a new Queue/Thread that will run the runLoop
    dispatch_queue_attr_t qos = dispatch_queue_attr_make_with_qos_class(DISPATCH_QUEUE_SERIAL, QOS_CLASS_USER_INTERACTIVE, -1);
    dispatch_queue_t queue = dispatch_queue_create("mrousavy/VisionCamera.preview", qos);
    dispatch_async(queue, ^{
      // Add the display link to the current run loop (thread on which we're currently running on)
      NSRunLoop* loop = [NSRunLoop currentRunLoop];
      [self->_displayLink addToRunLoop:loop forMode:NSRunLoopCommonModes];
      // Run the runLoop (blocking)
      [loop run];
      NSLog(@"VisionCamera: DisplayLink runLoop ended.");
    });
  }
}

- (void)stop {
  // check whether the loop is already stopped
  if (_displayLink != nil) {
    // if the display link is present, it gets invalidated (loop stops)
    
    [_displayLink invalidate];
    _displayLink = nil;
  }
}

- (void)update:(CADisplayLink *)sender {
  double time = sender.timestamp;
  
  double diff = time - _previousFrameTimestamp;
  _currentFps = 1.0 / diff;
  _previousFrameTimestamp = time;
  
  _updateBlock(time);
}

- (double)targetFps {
  return 1.0 / _displayLink.duration;
}

- (double)currentFps {
  return _currentFps;
}

@end
