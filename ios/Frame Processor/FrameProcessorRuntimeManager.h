//
//  FrameProcessorRuntimeManager.h
//  VisionCamera
//
//  Created by Marc Rousavy on 23.03.21.
//  Copyright © 2021 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <React/RCTBridge.h>

@interface FrameProcessorRuntimeManager : NSObject

- (instancetype) initWithBridge:(RCTBridge*)bridge;

- (void) installFrameProcessorBindings;

@end
