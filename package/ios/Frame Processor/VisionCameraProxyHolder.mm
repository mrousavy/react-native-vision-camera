//
//  VisionCameraProxyHolder.mm
//  DoubleConversion
//
//  Created by Marc Rousavy on 20.04.24.
//

#import <Foundation/Foundation.h>
#import "VisionCameraProxyHolder.h"
#import "VisionCameraProxy.h"

@implementation VisionCameraProxyHolder {
  VisionCameraProxy* _proxy;
}

- (instancetype)initWithProxy:(void*)proxy {
  if (self = [super init]) {
    _proxy = (VisionCameraProxy*)proxy;
  }
  return self;
}

- (VisionCameraProxy*)proxy {
  return _proxy;
}

@end
