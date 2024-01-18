//
//  SharedArray.mm
//  VisionCamera
//
//  Created by Marc Rousavy on 12.01.24.
//  Copyright © 2024 mrousavy. All rights reserved.
//

#import "SharedArray.h"
#import "MutableRawBuffer.h"
#import <Foundation/Foundation.h>
#import <jsi/jsi.h>

using namespace facebook;

@implementation SharedArray {
  uint8_t* _data;
  NSInteger _size;
  std::shared_ptr<jsi::ArrayBuffer> _arrayBuffer;
}

- (instancetype)initWithProxy:(VisionCameraProxyHolder*)proxy allocateWithSize:(NSInteger)size {
  uint8_t* data = (uint8_t*)malloc(size * sizeof(uint8_t));
  return [self initWithProxy:proxy wrapData:data withSize:size freeOnDealloc:YES];
}

- (instancetype)initWithProxy:(VisionCameraProxyHolder*)proxy
                     wrapData:(uint8_t*)data
                     withSize:(NSInteger)size
                freeOnDealloc:(BOOL)freeOnDealloc {
  if (self = [super init]) {
    jsi::Runtime& runtime = proxy.proxy->getWorkletRuntime();

    auto mutableBuffer = std::make_shared<vision::MutableRawBuffer>(data, size, freeOnDealloc);
    _arrayBuffer = std::make_shared<jsi::ArrayBuffer>(runtime, mutableBuffer);
    _data = data;
    _size = size;
  }
  return self;
}

- (instancetype)initWithRuntime:(jsi::Runtime&)runtime wrapArrayBuffer:(std::shared_ptr<jsi::ArrayBuffer>)arrayBuffer {
  if (self = [super init]) {
    _arrayBuffer = arrayBuffer;
    _data = _arrayBuffer->data(runtime);
    _size = _arrayBuffer->size(runtime);
  }
  return self;
}

- (std::shared_ptr<jsi::ArrayBuffer>)arrayBuffer {
  return _arrayBuffer;
}

- (uint8_t*)data {
  return _data;
}

- (NSInteger)size {
  return _size;
}

@end
