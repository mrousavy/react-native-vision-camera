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
}

@property(nonatomic, copy) block_t updateBlock;

// Start the DisplayLink's runLoop
- (void)start:(block_t)block;

// Stop the DisplayLink's runLoop
- (void)stop;

// The time (in milliseconds) we have until a next Frame is requested. If negative, we are dropping a Frame.
- (double)timeUntilNextFrame;

@end

#endif /* VisionDisplayLink_h */
