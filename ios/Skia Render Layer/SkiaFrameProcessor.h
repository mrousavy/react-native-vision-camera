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
#import "SkiaRenderer.h"

#ifdef __cplusplus
#import "WKTJsiWorklet.h"
#endif

@interface SkiaFrameProcessor: FrameProcessor

#ifdef __cplusplus
- (instancetype _Nonnull) initWithWorklet:(std::shared_ptr<RNWorklet::JsiWorklet>)worklet
                                  context:(std::shared_ptr<RNWorklet::JsiWorkletContext>)context
                             skiaRenderer:(SkiaRenderer* _Nonnull)skiaRenderer;
#endif

@end
