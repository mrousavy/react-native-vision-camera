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
  if(_displayLink == nil) {
    // specify update method
    _displayLink = [CADisplayLink displayLinkWithTarget:self selector:@selector(update:)];
    
    // add the display link to the main run loop
    [_displayLink addToRunLoop:[NSRunLoop mainRunLoop] forMode:NSRunLoopCommonModes];
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
  _updateBlock(time);
}

- (double)timeUntilNextFrame {
  // get the difference between when this frame should already be done (targe time) and now
  double frameDiff = _displayLink.targetTimestamp - CACurrentMediaTime();
  // seconds -> milliseconds
  return frameDiff * 1000;
}

@end
