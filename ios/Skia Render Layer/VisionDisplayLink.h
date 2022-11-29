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

- (void)start:(block_t)block;

- (void)stop;

@end

#endif /* VisionDisplayLink_h */
