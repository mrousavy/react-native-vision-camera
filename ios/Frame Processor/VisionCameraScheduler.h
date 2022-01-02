//
//  VisionCameraScheduler.h
//  VisionCamera
//
//  Created by Marc Rousavy on 23.07.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

#pragma once

#include <functional>
#import <React-callinvoker/ReactCommon/CallInvoker.h>

#if __has_include(<RNReanimated/RuntimeManager.h>)
  #import <RNReanimated/Scheduler.h>
#else
  // dummy placeholder
  namespace reanimated {
    class Scheduler {
    public:
      virtual void scheduleOnUI(std::function<void()> job);
    protected:
      std::shared_ptr<facebook::react::CallInvoker> jsCallInvoker_;
    };
  }
#endif

namespace vision {

class VisionCameraScheduler : public reanimated::Scheduler {
public:
  VisionCameraScheduler(std::shared_ptr<facebook::react::CallInvoker> jsInvoker);
  virtual ~VisionCameraScheduler();

  void scheduleOnUI(std::function<void()> job) override;
};

} // namespace vision
