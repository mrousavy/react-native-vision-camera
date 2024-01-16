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

namespace vision {
// forward-declaration since we cannot import C++ headers here yet.
class TypedArrayBase;
}
#endif

// Needs to be in sync with JSITypedArray.h as the index is used
typedef NS_ENUM(NSInteger, SharedArrayType) {
  Int8Array,
  Int16Array,
  Int32Array,
  Uint8Array,
  Uint8ClampedArray,
  Uint16Array,
  Uint32Array,
  Float32Array,
  Float64Array,
};

@interface SharedArray : NSObject

- (instancetype _Nonnull)init NS_UNAVAILABLE;

- (instancetype _Nonnull)initWithProxy:(VisionCameraProxyHolder* _Nonnull)proxy type:(SharedArrayType)type size:(NSInteger)size;

#ifdef __cplusplus
- (instancetype _Nonnull)initWithRuntime:(jsi::Runtime&)runtime typedArray:(std::shared_ptr<vision::TypedArrayBase>)typedArray;

- (std::shared_ptr<vision::TypedArrayBase>)typedArray;
#endif

@property(nonatomic, readonly, nonnull) uint8_t* data;
@property(nonatomic, readonly) NSInteger count;

@end
