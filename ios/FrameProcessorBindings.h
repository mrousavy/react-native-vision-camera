//
//  FrameProcessorBindings.h
//  VisionCamera
//
//  Created by Marc Rousavy on 25.02.21.
//  Copyright © 2021 Facebook. All rights reserved.
//

#import "FrameProcessorDefinitions.h"

#ifdef ENABLE_FRAME_PROCESSORS

#import <Foundation/Foundation.h>
#import <React/RCTBridge.h>

@interface FrameProcessorBindings : NSObject

+ (void) installFrameProcessorBindings:(RCTBridge*)bridge;
+ (void) uninstallFrameProcessorBindings;

@end

#endif
