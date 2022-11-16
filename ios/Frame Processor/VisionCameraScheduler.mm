//
//  VisionCameraScheduler.mm
//  VisionCamera
//
//  Created by Marc Rousavy on 23.07.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "VisionCameraScheduler.h"

#import <React/RCTBridge+Private.h>
#import <React-callinvoker/ReactCommon/CallInvoker.h>
#import "../React Utils/RCTBridge+runOnJS.h"

namespace vision {

using namespace facebook;

VisionCameraScheduler::VisionCameraScheduler(std::shared_ptr<react::CallInvoker> jsInvoker) {
  this->jsCallInvoker_ = jsInvoker;
}

// does not schedule on UI thread but rather on Frame Processor Thread
void VisionCameraScheduler::scheduleOnUI(std::function<void()> job) {
  [[RCTBridge currentBridge] runOnJS:^{
    job();
  }];
}

VisionCameraScheduler::~VisionCameraScheduler(){
}


} // namespace vision
