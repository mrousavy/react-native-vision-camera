//
//  ExamplePluginSwift.m
//  VisionCamera
//
//  Created by Marc Rousavy on 01.05.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <VisionCamera/FrameProcessorPlugin.h>

// Plugin implemented in Swift

@interface ExamplePluginSwift : FrameProcessorPlugin
@end

// Wrapper registers Swift Plugin

@interface ExamplePluginSwiftWrapper : NSObject
@end

@implementation ExamplePluginSwiftWrapper

+ (void) load {
  [FrameProcessorPlugin registerPlugin:[[ExamplePluginSwift alloc] init]];
}

@end
