//
//  RCTBridge+logToJS.h
//  VisionCamera
//
//  Created by Marc Rousavy on 29.11.22.
//  Copyright © 2022 mrousavy. All rights reserved.
//

#ifndef RCTBridge_logToJS_h
#define RCTBridge_logToJS_h

#import "JSConsoleHelper.h"

#import <React/RCTBridge.h>
#import <React/RCTBridge+Private.h>
#import <ReactCommon/RCTTurboModule.h>

@implementation RCTBridge(logToJS)

+ (void)logToJS:(RCTLogLevel)level message:(NSString*)message {
  RCTBridge* bridge = [RCTBridge currentBridge];
  if (bridge != nil) {
    bridge.jsCallInvoker->invokeAsync(^{
      auto logFn = [JSConsoleHelper getLogFunctionForBridge:bridge];
      logFn(level, message);
    });
  } else {
    NSLog(@"VisionCamera: %@", message);
  }
}

@end

#endif /* RCTBridge_logToJS_h */
