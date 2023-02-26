//
//  VisionDisplayLink.h
//  VisionCamera
//
//  Created by Marc Rousavy on 28.11.22.
//  Copyright © 2022 mrousavy. All rights reserved.
//

#ifndef DisplayLink_h
#define DisplayLink_h

#import <CoreFoundation/CoreFoundation.h>
#import <UIKit/UIKit.h>

typedef void (^block_t)(double);
@interface VisionDisplayLink : NSObject {
  CADisplayLink *_displayLink;
  double _currentFps;
  double _previousFrameTimestamp;
}

@property(nonatomic, copy) block_t updateBlock;

// Start the DisplayLink's runLoop
- (void)start:(block_t)block;

// Stop the DisplayLink's runLoop
- (void)stop;

// Get the current FPS value
- (double)currentFps;

// The FPS value this DisplayLink is targeting
- (double)targetFps;

@end

#endif /* VisionDisplayLink_h */
