//
//  SkiaRenderer.h
//  VisionCamera
//
//  Created by Marc Rousavy on 19.07.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

#pragma once

#import <Foundation/Foundation.h>
#import <AVFoundation/AVFoundation.h>
#import <Metal/Metal.h>

typedef void* SkiaCanvas;
typedef void(^draw_callback_t)(SkiaCanvas _Nonnull);

/**
 A Camera Frame Renderer powered by Skia.
 It provides two Contexts, one offscreen and one onscreen.
 - Offscreen Context: Allows you to render a Frame into a Skia Canvas and draw onto it using Skia commands
 - Onscreen Context: Allows you to render a Frame from the offscreen context onto a Layer allowing it to be displayed for Preview.
 
 The two contexts may run at different Frame Rates.
 */
@interface SkiaRenderer : NSObject

/**
 Renders the given Camera Frame to the offscreen Skia Canvas.
 The given callback will be executed with a reference to the Skia Canvas
 for the user to perform draw operations on (in this case, through a JS Frame Processor)
 */
- (void)renderCameraFrameToOffscreenCanvas:(CMSampleBufferRef _Nonnull)sampleBuffer withDrawCallback:(draw_callback_t _Nonnull)callback;
/**
 Renders the latest Frame to the onscreen Layer.
 This should be called everytime you want the UI to update, e.g. for 60 FPS; every 16.66ms.
 */
- (void)renderLatestFrameToLayer:(CALayer* _Nonnull)layer;

/**
 The Metal Device used for Rendering to the Layer
 */
@property (nonatomic, readonly) id<MTLDevice> _Nonnull metalDevice;

@end
