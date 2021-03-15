//
//  FrameProcessorCallback.h
//  VisionCamera
//
//  Created by Marc Rousavy on 11.03.21.
//  Copyright © 2021 Facebook. All rights reserved.
//

#pragma once

#include <jsi/jsi.h>

typedef void (^FrameProcessorCallback) (facebook::jsi::HostObject frame);
