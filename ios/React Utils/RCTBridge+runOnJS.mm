//
//  RCTBridge+runOnJS.mm
//  VisionCamera
//
//  Created by Marc Rousavy on 23.03.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

#import "RCTBridge+runOnJS.h"
#import <Foundation/Foundation.h>
#import <React/RCTBridge.h>
#import <ReactCommon/RCTTurboModule.h>

@implementation RCTBridge (RunOnJS)

- (void) runOnJS:(void (^)())block {
  auto callInvoker = [self jsCallInvoker];
  callInvoker->invokeAsync([block]() {
    block();
  });
}

@end
