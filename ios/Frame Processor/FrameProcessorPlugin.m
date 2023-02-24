//
//  FrameProcessorPlugin.m
//  VisionCamera
//
//  Created by Marc Rousavy on 24.02.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "FrameProcessorPlugin.h"
#import "FrameProcessorPluginRegistry.h"

@implementation FrameProcessorPlugin

- (NSString *)name {
  [NSException raise:NSInternalInconsistencyException
              format:@"Frame Processor Plugin \"%@\" does not override the `name` getter!", [self name]];
  return nil;
}

- (id)callback:(Frame *)frame withArguments:(NSArray<id> *)arguments {
  [NSException raise:NSInternalInconsistencyException
              format:@"Frame Processor Plugin \"%@\" does not override the `callback(frame:withArguments:)` method!", [self name]];
  return nil;
}

+ (void)registerPlugin:(FrameProcessorPlugin *)plugin {
  [FrameProcessorPluginRegistry addFrameProcessorPlugin:plugin];
}

@end
