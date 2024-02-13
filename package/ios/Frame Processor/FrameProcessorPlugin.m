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

- (nullable id)callback:(Frame* _Nonnull)frame
           withArguments:(NSDictionary* _Nullable)arguments
                   error:(NSError* __autoreleasing _Nullable* _Nullable)error {
  *error = [NSError errorWithDomain:NSInternalInconsistencyException
                               code:0
                           userInfo:@{NSLocalizedDescriptionKey: @"Frame Processor Plugin does not override the `callback(frame:withArguments:)` method!"}];
  return nil;
}

@end
