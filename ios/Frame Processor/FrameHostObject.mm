//
//  FrameHostObject.m
//  VisionCamera
//
//  Created by Marc Rousavy on 22.03.21.
//  Copyright © 2021 Facebook. All rights reserved.
//

#import "FrameHostObject.h"
#import <Foundation/Foundation.h>
#import <jsi/jsi.h>

jsi::Value FrameHostObject::get(jsi::Runtime& runtime, const jsi::PropNameID& name) {
  // TODO: Implement custom getters so you can access the frame from JS
  return jsi::Value(42);
}

void FrameHostObject::destroyBuffer() {
  this->buffer = nil;
}
