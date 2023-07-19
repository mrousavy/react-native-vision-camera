//
//  SkiaRenderContext.h
//  VisionCamera
//
//  Created by Marc Rousavy on 02.12.22.
//  Copyright © 2022 mrousavy. All rights reserved.
//

#pragma once

#import <MetalKit/MetalKit.h>
#import <include/gpu/GrDirectContext.h>

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
