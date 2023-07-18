//
//  SkiaMetalRenderContext.h
//  VisionCamera
//
//  Created by Marc Rousavy on 02.12.22.
//  Copyright © 2022 mrousavy. All rights reserved.
//

#pragma once

#import <MetalKit/MetalKit.h>
#import <QuartzCore/CAMetalLayer.h>
#import <AVFoundation/AVFoundation.h>
#import <include/gpu/GrDirectContext.h>
#import "VisionDisplayLink.h"

struct RenderContext {
  id<MTLDevice> device;
  id<MTLCommandQueue> commandQueue;
  sk_sp<GrDirectContext> skiaContext;
  
  RenderContext() {
    device = MTLCreateSystemDefaultDevice();
    commandQueue = id<MTLCommandQueue>(CFRetain((GrMTLHandle)[device newCommandQueue]));
    skiaContext = GrDirectContext::MakeMetal((__bridge void*)device,
                                             (__bridge void*)commandQueue);
  }
};

// For rendering to an off-screen in-memory Metal Texture (MTLTexture)
struct OffscreenRenderContext: public RenderContext {
  id<MTLTexture> texture;
};

// For rendering to a Metal Layer (CAMetalLayer)
struct LayerRenderContext: public RenderContext {
  CAMetalLayer* layer;
  VisionDisplayLink* displayLink;
};
