//
//  SkiaFrameProcessor.h
//  VisionCamera
//
//  Created by Marc Rousavy on 14.07.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

#pragma once

#import <Foundation/Foundation.h>
#import "FrameProcessor.h"
#import "SkiaMetalRenderContext.h"

typedef void (^render_block_t)(const OffscreenRenderContext&);

@interface SkiaFrameProcessor : FrameProcessor

/**
 Render the latest Frame from the Camera.
 The callback (`render_block_t`) will be invoked with a read-access
 texture that can be used for rendering.
 */
- (void)renderLatestFrame:(render_block_t _Nonnull)callback;
- (bool)hasNewFrame;

@end
