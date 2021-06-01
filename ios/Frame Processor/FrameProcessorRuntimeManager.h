//
//  FrameProcessorRuntimeManager.h
//  VisionCamera
//
//  Created by Marc Rousavy on 23.03.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

#pragma once

#import <Foundation/Foundation.h>
#import <React/RCTBridge.h>

@interface FrameProcessorRuntimeManager : NSObject

- (instancetype)init NS_UNAVAILABLE;

/**
 Initializes the Frame Processor Runtime Manager with the given bridge.
 This init is not thread safe, so only init this on the Thread you want the runtime to run on.
 */
- (instancetype) initWithBridge:(RCTBridge*)bridge;

- (void) installFrameProcessorBindings;

@end
