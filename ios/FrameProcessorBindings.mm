//
//  FrameProcessorBindings.mm
//  VisionCamera
//
//  Created by Marc Rousavy on 25.02.21.
//  Copyright © 2021 Facebook. All rights reserved.
//

#import "FrameProcessorBindings.h"
#import <React/RCTBridge.h>
#import <React/RCTBridge+Private.h>
#import <jsi/jsi.h>

using namespace facebook;

void installFrameProcessorBindings(RCTBridge* bridge) {
  RCTCxxBridge *cxxBridge = (RCTCxxBridge *)bridge;
  if (!cxxBridge.runtime) {
    return;
  }
  jsi::Runtime& runtime = *(jsi::Runtime*)cxxBridge.runtime;
  
}
