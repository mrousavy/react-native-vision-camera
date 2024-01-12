//
//  FrameProcessorPlugin.m
//  VisionCamera
//
//  Created by Marc Rousavy on 31.07.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

#import "FrameProcessorPlugin.h"

// Base implementation (empty)
@implementation FrameProcessorPlugin

- (instancetype)initWithProxy:(VisionCameraProxyHolder* _Nonnull)proxy withOptions:(NSDictionary* _Nullable)options {
  self = [super init];
  return self;
}

- (id _Nullable)callback:(Frame* _Nonnull)frame withArguments:(NSDictionary* _Nullable)arguments {
  [NSException raise:NSInternalInconsistencyException
              format:@"Frame Processor Plugin does not override the `callback(frame:withArguments:)` method!"];
  return nil;
}

@end
