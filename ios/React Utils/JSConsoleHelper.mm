//
//  JSConsoleHelper.mm
//  VisionCamera
//
//  Created by Marc Rousavy on 02.06.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "JSConsoleHelper.h"

#import <React/RCTBridge.h>
#import <ReactCommon/RCTTurboModule.h>
#import <React/RCTBridge+Private.h>
#import <jsi/jsi.h>
#import "RCTBridge+runOnJS.h"

@implementation JSConsoleHelper

+ (const char *) getLogFunctionNameForLogLevel:(RCTLogLevel)level {
  switch (level) {
    case RCTLogLevelTrace:
      return "trace";
    case RCTLogLevelInfo:
      return "log";
    case RCTLogLevelWarning:
      return "warn";
    case RCTLogLevelError:
    case RCTLogLevelFatal:
      return "error";
  }
}

+ (ConsoleLogFunction) getLogFunctionForBridge:(RCTBridge*)bridge {
  RCTCxxBridge *cxxBridge = (RCTCxxBridge *)bridge;
  if (!cxxBridge.runtime) {
    return nil;
  }
  
  jsi::Runtime* jsiRuntime = (jsi::Runtime*)cxxBridge.runtime;
  
  return ^(RCTLogLevel level, NSString* message) {
    [bridge runOnJS:^{
      if (jsiRuntime != nullptr) {
        jsi::Runtime& runtime = *jsiRuntime;
        auto logFunctionName = [JSConsoleHelper getLogFunctionNameForLogLevel:level];
        try {
          auto console = runtime.global().getPropertyAsObject(runtime, "console");
          auto log = console.getPropertyAsFunction(runtime, logFunctionName);
          log.call(runtime, jsi::String::createFromAscii(runtime, [message UTF8String]));
        } catch (jsi::JSError& jsError) {
          NSLog(@"%@", message);
          NSLog(@"Failed to call `console.%s`: %s", logFunctionName, jsError.getMessage().c_str());
        }
      }
    }];
  };
}

@end
