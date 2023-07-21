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

- (instancetype _Nonnull) initWithOptions:(NSDictionary* _Nullable)options {
  self = [super init];
  return self;
}

+ (NSString*)name {
  [NSException raise:NSInternalInconsistencyException
              format:@"Frame Processor Plugin does not override the `name` getter!"];
  return nil;
}

- (id _Nullable)callback:(Frame* _Nonnull)frame withArguments:(NSDictionary* _Nullable)arguments {
  [NSException raise:NSInternalInconsistencyException
              format:@"Frame Processor Plugin does not override the `callback(frame:withArguments:)` method!"];
  return nil;
}

@end
