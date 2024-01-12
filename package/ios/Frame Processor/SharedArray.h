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
#import "JSITypedArray.h"
#import <jsi/jsi.h>
using namespace facebook;
#endif

typedef enum SharedArrayType : NSUInteger {
  // Needs to be in sync with JSITypedArray.h as the index is used
  Int8Array,
  Int16Array,
  Int32Array,
  Uint8Array,
  Uint8ClampedArray,
  Uint16Array,
  Uint32Array,
  Float32Array,
  Float64Array,
} TypedArrayType;

@interface SharedArray : NSObject

- (instancetype)initWithProxy:(VisionCameraProxyHolder*)proxy type:(TypedArrayType)type size:(int)size;

#ifdef __cplusplus
- (instancetype)initWithRuntime:(jsi::Runtime&)runtime typedArray:(std::shared_ptr<vision::TypedArrayBase>)typedArray;

- (std::shared_ptr<vision::TypedArrayBase>)typedArray;
#endif

- (NSData*)data;

@end
