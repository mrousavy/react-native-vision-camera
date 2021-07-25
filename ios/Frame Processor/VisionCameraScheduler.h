//
//  VisionCameraScheduler.h
//  VisionCamera
//
//  Created by Marc Rousavy on 23.07.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

#pragma once

#import <RNReanimated/Scheduler.h>
#import <React-callinvoker/ReactCommon/CallInvoker.h>

namespace vision {

using namespace facebook;

class VisionCameraScheduler : public reanimated::Scheduler {
public:
  VisionCameraScheduler(std::shared_ptr<react::CallInvoker> jsInvoker);
  virtual ~VisionCameraScheduler();
  
  void scheduleOnUI(std::function<void()> job) override;
};

} // namespace vision
