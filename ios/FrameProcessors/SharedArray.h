//
//  SharedArray.h
//  VisionCamera
//
//  Created by Marc Rousavy on 12.01.24.
//  Copyright © 2024 mrousavy. All rights reserved.
//

#pragma once

#import "VisionCameraProxyHolder.h"
#import <Foundation/Foundation.h>

#ifdef __cplusplus
#import <jsi/jsi.h>
using namespace facebook;
#endif

NS_ASSUME_NONNULL_BEGIN

/**
 * An ArrayBuffer of type uint8 that can be shared between native and JS without copying.
 */
@interface SharedArray : NSObject

- (instancetype)init NS_UNAVAILABLE;

/**
 * Allocates a new SharedArray with the given size.
 * Use `data` to write to the SharedArray.
 */
- (instancetype)initWithProxy:(VisionCameraProxyHolder*)proxy allocateWithSize:(NSInteger)size;

/**
 * Wraps the given data in a SharedArray without copying.
 * Use `data` to write to the SharedArray.
 */
- (instancetype)initWithProxy:(VisionCameraProxyHolder*)proxy
                     wrapData:(uint8_t*)data
                     withSize:(NSInteger)size
                freeOnDealloc:(BOOL)freeOnDealloc;

#ifdef __cplusplus
/**
 * Wraps the given JSI ArrayBuffer in a SharedArray for native access.
 * Use `data` to write to the SharedArray.
 */
- (instancetype)initWithRuntime:(jsi::Runtime&)runtime wrapArrayBuffer:(std::shared_ptr<jsi::ArrayBuffer>)arrayBuffer;

- (std::shared_ptr<jsi::ArrayBuffer>)arrayBuffer;
#endif

/**
 * The underlying contents of the ArrayBuffer which can be used for reading and writing.
 */
@property(nonatomic, readonly, nonnull) uint8_t* data;
/**
 * The size of the ArrayBuffer.
 */
@property(nonatomic, readonly) NSInteger size;

@end

NS_ASSUME_NONNULL_END
