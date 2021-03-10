//
//  FrameProcessorManager.h
//  VisionCamera
//
//  Created by Marc Rousavy on 10.03.21.
//  Copyright © 2021 Facebook. All rights reserved.
//

#pragma once

#include <RNReanimated/RuntimeManager.h>
#include <jsi/jsi.h>

namespace vision {

using namespace facebook;

class FrameProcessorManager: public RuntimeManager {
  FrameProcessorManager(jsi::Runtime& runtime);
};

}
