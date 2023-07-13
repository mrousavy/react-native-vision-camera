//
//  FrameProcessorContext.h
//  VisionCamera
//
//  Created by Marc Rousavy on 13.07.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

#pragma once

#import <Foundation/Foundation.h>
#import <AVFoundation/AVFoundation.h>
#import "Frame.h"

#ifdef __cplusplus
#import "WKTJsiWorklet.h"
#endif

@interface FrameProcessor : NSObject

#ifdef __cplusplus
- (instancetype _Nonnull) initWithWorklet:(std::shared_ptr<RNWorklet::JsiWorkletContext>)context worklet:(std::shared_ptr<RNWorklet::JsiWorklet>)worklet;
#endif

- (void) call:(Frame* _Nonnull)frame;

@end
