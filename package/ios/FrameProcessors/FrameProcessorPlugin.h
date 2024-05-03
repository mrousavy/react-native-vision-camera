//
//  FrameProcessorPlugin.h
//  VisionCamera
//
//  Created by Marc Rousavy on 01.05.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

#pragma once

#import "Frame.h"
#import "FrameProcessorPluginRegistry.h"
#import "VisionCameraProxyHolder.h"
#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * The base class of a native Frame Processor Plugin.
 *
 * Subclass this to create a custom Frame Processor Plugin, which can be called from a JS Frame Processor.
 * Once subclassed, it needs to be registered in the VisionCamera Frame Processor runtime via
 * the `VISION_EXPORT_FRAME_PROCESSOR` or `VISION_EXPORT_SWIFT_FRAME_PROCESSOR` macros.

 * See: <a href="https://react-native-vision-camera.com/docs/guides/frame-processors-plugins-ios">Creating Frame Processor Plugins (iOS)</a>
 * for more information
 */
@interface FrameProcessorPlugin : NSObject

/**
 * The initializer of this Frame Processor Plugin.
 * This is called everytime this Frame Processor Plugin is loaded from the JS side (`VisionCameraProxy.initFrameProcessorPlugin(..)`).
 * Optionally override this method to implement custom initialization logic.
 * - Parameters:
 *   - proxy: The VisionCameraProxy instance for using the Frame Processor Context, e.g. to initialize SharedArrays.
 *   - options: An options dictionary passed from the JS side, or `nil` if none.
 */
- (instancetype _Nonnull)initWithProxy:(VisionCameraProxyHolder*)proxy
                           withOptions:(NSDictionary* _Nullable)options NS_SWIFT_NAME(init(proxy:options:));

- (instancetype _Nonnull)init NS_UNAVAILABLE;

/**
 * The actual Frame Processor Plugin's implementation that runs when `plugin.call(..)` is called in the JS Frame Processor.
 * Implement your Frame Processing here, and keep in mind that this is a hot-path so optimize as good as possible.
 * See: <a href="https://react-native-vision-camera.com/docs/guides/frame-processors-tips#fast-frame-processor-plugins">Performance Tips</a>
 *
 * - Parameters:
 *   - frame: The Frame from the Camera. Don't do any ref-counting on this, as VisionCamera handles that.
 *   - arguments: An options dictionary passed from the JS side, or `nil` if none.
 * - Returns: You can return any primitive, map or array you want.
 *            See the <a href="https://react-native-vision-camera.com/docs/guides/frame-processors-plugins-overview#types">Types</a>
 *            table for a list of supported types.
 */
- (id _Nullable)callback:(Frame*)frame withArguments:(NSDictionary* _Nullable)arguments;

@end

NS_ASSUME_NONNULL_END

#define VISION_CONCAT2(A, B) A##B
#define VISION_CONCAT(A, B) VISION_CONCAT2(A, B)

#define VISION_EXPORT_FRAME_PROCESSOR(frame_processor_class, frame_processor_plugin_name)                                                  \
  +(void)load {                                                                                                                            \
    [FrameProcessorPluginRegistry                                                                                                          \
        addFrameProcessorPlugin:@ #frame_processor_plugin_name                                                                             \
                withInitializer:^FrameProcessorPlugin*(VisionCameraProxyHolder* _Nonnull proxy, NSDictionary* _Nullable options) {         \
                  return [[frame_processor_class alloc] initWithProxy:proxy withOptions:options];                                          \
                }];                                                                                                                        \
  }

#define VISION_EXPORT_SWIFT_FRAME_PROCESSOR(frame_processor_class, frame_processor_plugin_name)                                            \
                                                                                                                                           \
  @interface frame_processor_class (FrameProcessorPluginLoader)                                                                            \
  @end                                                                                                                                     \
                                                                                                                                           \
  @implementation frame_processor_class (FrameProcessorPluginLoader)                                                                       \
                                                                                                                                           \
  __attribute__((constructor)) static void VISION_CONCAT(initialize_, frame_processor_plugin_name)(void) {                                 \
    [FrameProcessorPluginRegistry addFrameProcessorPlugin:@ #frame_processor_plugin_name                                                   \
                                          withInitializer:^FrameProcessorPlugin* _Nonnull(VisionCameraProxyHolder* _Nonnull proxy,         \
                                                                                          NSDictionary* _Nullable options) {               \
                                            return [[frame_processor_class alloc] initWithProxy:proxy withOptions:options];                \
                                          }];                                                                                              \
  }                                                                                                                                        \
                                                                                                                                           \
  @end
