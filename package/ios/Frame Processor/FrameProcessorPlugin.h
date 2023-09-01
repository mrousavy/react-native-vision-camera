//
//  FrameProcessorPlugin.h
//  VisionCamera
//
//  Created by Marc Rousavy on 01.05.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

#pragma once

#import "Frame.h"
#import <Foundation/Foundation.h>

/// The base class for a Frame Processor Plugin which can be called synchronously from a JS Frame
/// Processor.
///
/// Subclass this class in a Swift or Objective-C class and override the `callback:withArguments:`
/// method, and implement your Frame Processing there.
///
/// Use `[FrameProcessorPluginRegistry addFrameProcessorPlugin:]` to register the Plugin to the
/// VisionCamera Runtime.
@interface FrameProcessorPlugin : NSObject

/// The actual callback when calling this plugin. Any Frame Processing should be handled there.
/// Make sure your code is optimized, as this is a hot path.
- (id _Nullable)callback:(Frame* _Nonnull)frame withArguments:(NSDictionary* _Nullable)arguments;

@end
