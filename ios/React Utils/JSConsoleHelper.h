//
//  JSConsoleHelper.h
//  VisionCamera
//
//  Created by Marc Rousavy on 02.06.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

#pragma once

#import <React/RCTBridge.h>
#import <React/RCTLog.h>

@interface JSConsoleHelper : NSObject

typedef void (^ConsoleLogFunction) (RCTLogLevel level, NSString* message);

+ (ConsoleLogFunction) getLogFunctionForBridge:(RCTBridge*)bridge;

@end
