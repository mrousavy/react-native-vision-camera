//
//  VisionCameraProxyDelegate.h
//  Pods
//
//  Created by Marc Rousavy on 20.04.24.
//

#pragma once

#import "FrameProcessor.h"
#import <Foundation/Foundation.h>
#import <React/RCTBridge.h>

NS_ASSUME_NONNULL_BEGIN

/**
 A delegate to implement which will be used by the VisionCameraProxy.
 */
@protocol VisionCameraProxyDelegate <NSObject>

- (void)setFrameProcessor:(FrameProcessor*)frameProcessor forView:(NSNumber*)viewTag;
- (void)removeFrameProcessorForView:(NSNumber*)viewTag;

- (dispatch_queue_t)getDispatchQueue;
- (RCTBridge*)getBridge;

@end

NS_ASSUME_NONNULL_END
