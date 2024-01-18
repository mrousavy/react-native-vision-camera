//
//  SharedArray.h
//  VisionCamera
//
//  Created by Marc Rousavy on 12.01.24.
//  Copyright © 2024 mrousavy. All rights reserved.
//

#pragma once

#import "VisionCameraProxy.h"
#import <Foundation/Foundation.h>

#ifdef __cplusplus
#import <jsi/jsi.h>
using namespace facebook;
#endif

NS_ASSUME_NONNULL_BEGIN

@interface SharedArray : NSObject

- (instancetype)init NS_UNAVAILABLE;

- (instancetype)initWithProxy:(VisionCameraProxyHolder*)proxy allocateWithSize:(NSInteger)size;

- (instancetype)initWithProxy:(VisionCameraProxyHolder*)proxy
                     wrapData:(uint8_t*)data
                     withSize:(NSInteger)size
                freeOnDealloc:(BOOL)freeOnDealloc;

#ifdef __cplusplus
- (instancetype)initWithRuntime:(jsi::Runtime&)runtime wrapArrayBuffer:(std::shared_ptr<jsi::ArrayBuffer>)arrayBuffer;

- (std::shared_ptr<jsi::ArrayBuffer>)arrayBuffer;
#endif

@property(nonatomic, readonly, nonnull) uint8_t* data;
@property(nonatomic, readonly) NSInteger size;

@end

NS_ASSUME_NONNULL_END
