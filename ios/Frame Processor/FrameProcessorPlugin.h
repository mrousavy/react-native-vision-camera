//
//  FrameProcessorPlugin.h
//  VisionCamera
//
//  Created by Marc Rousavy on 01.05.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

#pragma once

#import <Foundation/Foundation.h>
#import "Frame.h"

/// The base class for a Frame Processor Plugin which can be called synchronously from a JS Frame Processor.
///
/// Override the following methods:
///
/// - `initWithOptions:`: (optional) A custom initializer function for setting up your Plugin.
/// - `name`: The name to register this plugin under
/// - `callback:withArguments:`: The function for this Frame Processor Plugin
///
/// Subclass this class in a Swift or Objective-C class and override the `callback:withArguments:` method, and
/// implement your Frame Processing there.
/// Then, in your App's startup (AppDelegate.m), call `FrameProcessorPluginBase.registerPlugin(YourNewPlugin())`
@interface FrameProcessorPlugin : NSObject

/// Called whenever a new instance of this Frame Processor Plugin is created
/// from JS. Options are optional values from the JavaScript constructor.
/// To create a new instance of this plugin, call `VisionCameraProxy.getFrameProcessorPlugin(..)` from JS
- (instancetype _Nonnull) initWithOptions:(NSDictionary* _Nullable)options;

/// Get the name of the Frame Processor Plugin.
+ (NSString* _Nonnull)name;

/// The actual callback when calling this plugin. Any Frame Processing should be handled there.
/// Make sure your code is optimized, as this is a hot path.
- (id _Nullable) callback:(Frame* _Nonnull)frame withArguments:(NSDictionary* _Nullable)arguments;

@end
