//
//  SharedArray.mm
//  VisionCamera
//
//  Created by Marc Rousavy on 12.01.24.
//  Copyright © 2024 mrousavy. All rights reserved.
//

#import "SharedArray.h"
#import "JSITypedArray.h"
#import <Foundation/Foundation.h>
#import <jsi/jsi.h>

using namespace facebook;

@implementation SharedArray {
  uint8_t* _data;
  NSInteger _size;
  std::shared_ptr<vision::TypedArrayBase> _array;
}

vision::TypedArrayKind getTypedArrayKind(int unsafeEnumValue) {
  return static_cast<vision::TypedArrayKind>(unsafeEnumValue);
}

- (instancetype)initWithProxy:(VisionCameraProxyHolder*)proxy type:(SharedArrayType)type size:(NSInteger)size {
  if (self = [super init]) {
    jsi::Runtime& runtime = proxy.proxy->getWorkletRuntime();
    vision::TypedArrayKind kind = getTypedArrayKind((int)type);
    _array = std::make_shared<vision::TypedArrayBase>(vision::TypedArrayBase(runtime, size, kind));
    _data = _array->getBuffer(runtime).data(runtime);
    _size = size;
  }
  return self;
}

- (instancetype)initWithRuntime:(jsi::Runtime&)runtime typedArray:(std::shared_ptr<vision::TypedArrayBase>)typedArray {
  if (self = [super init]) {
    _array = typedArray;
    _data = _array->getBuffer(runtime).data(runtime);
    _size = _array->getBuffer(runtime).size(runtime);
  }
  return self;
}

- (std::shared_ptr<vision::TypedArrayBase>)typedArray {
  return _array;
}

- (uint8_t*)data {
  return _data;
}

- (NSInteger)size {
  return _size;
}

@end
