//
//  VisionCameraScheduler.mm
//  VisionCamera
//
//  Created by Marc Rousavy on 23.07.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "VisionCameraScheduler.h"

// Forward declarations for the Swift classes
__attribute__((objc_runtime_name("_TtC12VisionCamera12CameraQueues")))
@interface CameraQueues : NSObject
@property (nonatomic, class, readonly, strong) dispatch_queue_t _Nonnull frameProcessorQueue;
@end

namespace vision {

// does not schedule on UI thread but rather on Frame Processor Thread
void VisionCameraScheduler::scheduleOnUI(std::function<void()> job) {
  dispatch_async(CameraQueues.frameProcessorQueue, ^{
    job();
  });
}

} // namespace vision
