//
//  SharedArray.mm
//  VisionCamera
//
//  Created by Marc Rousavy on 12.01.24.
//  Copyright © 2024 mrousavy. All rights reserved.
//

#import "JSITypedArray.h"
#import "SharedArray.h"
#import <Foundation/Foundation.h>
#import <jsi/jsi.h>

using namespace facebook;

@implementation SharedArray {
  NSData* _data;
  std::shared_ptr<vision::TypedArrayBase> _array;
}

vision::TypedArrayKind getTypedArrayKind(int unsafeEnumValue) {
  return static_cast<vision::TypedArrayKind>(unsafeEnumValue);
}

NSData* wrapInNSData(jsi::Runtime& runtime, std::shared_ptr<vision::TypedArrayBase> typedArray) {
  jsi::ArrayBuffer buffer = typedArray->getBuffer(runtime);
  return [NSData dataWithBytesNoCopy:buffer.data(runtime) length:buffer.size(runtime) freeWhenDone:NO];
}

- (instancetype)initWithProxy:(VisionCameraProxyHolder*)proxy type:(SharedArrayType)type size:(NSInteger)size {
  if (self = [super init]) {
    jsi::Runtime& runtime = proxy.proxy->getWorkletRuntime();
    vision::TypedArrayKind kind = getTypedArrayKind((int)type);
    _array = std::make_shared<vision::TypedArrayBase>(vision::TypedArrayBase(runtime, size, kind));
    _data = wrapInNSData(runtime, _array);
  }
  return self;
}

- (instancetype)initWithRuntime:(jsi::Runtime&)runtime typedArray:(std::shared_ptr<vision::TypedArrayBase>)typedArray {
  if (self = [super init]) {
    _array = typedArray;
    _data = wrapInNSData(runtime, typedArray);
  }
  return self;
}

- (std::shared_ptr<vision::TypedArrayBase>)typedArray {
  return _array;
}

- (NSData*)data {
  return _data;
}

@end
