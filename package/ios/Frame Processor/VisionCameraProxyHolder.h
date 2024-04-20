//
//  VisionCameraProxyHolder.h
//  Pods
//
//  Created by Marc Rousavy on 20.04.24.
//

#pragma once

#import "FrameProcessor.h"
#import <Foundation/Foundation.h>

#ifdef __cplusplus
#import "VisionCameraProxy.h"
#endif

NS_ASSUME_NONNULL_BEGIN

/**
 An Objective-C/Swift class that holds the C++ VisionCameraProxy.
 */
@interface VisionCameraProxyHolder : NSObject

- (_Nonnull instancetype)initWithProxy:(void*)proxy;

#ifdef __cplusplus
- (VisionCameraProxy*)proxy;
#endif

@end

NS_ASSUME_NONNULL_END
