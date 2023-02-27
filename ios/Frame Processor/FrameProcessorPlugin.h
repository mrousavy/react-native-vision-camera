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
/// Subclass this class in a Swift or Objective-C class and override the `callback:withArguments:` method, and
/// implement your Frame Processing there.
/// Then, in your App's startup (AppDelegate.m), call `FrameProcessorPluginBase.registerPlugin(YourNewPlugin())`
@interface FrameProcessorPlugin : NSObject

/// Get the name of the Frame Processor Plugin.
/// This will be exposed to JS under the `FrameProcessorPlugins` Proxy object.
- (NSString *)name;

/// The actual callback when calling this plugin. Any Frame Processing should be handled there.
/// Make sure your code is optimized, as this is a hot path.
- (id) callback:(Frame*)frame withArguments:(NSArray<id>*)arguments;

/// Register the given plugin in the Plugin Registry. This should be called on App Startup.
+ (void) registerPlugin:(FrameProcessorPlugin*)plugin;

@end
