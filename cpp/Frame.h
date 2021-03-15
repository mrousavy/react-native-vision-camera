//
//  Frame.h
//  VisionCamera
//
//  Created by Marc Rousavy on 15.03.21.
//  Copyright © 2021 Facebook. All rights reserved.
//

#pragma once

#include <jsi/jsi.h>

namespace vision {

using namespace facebook;

// TODO: Write some getters for the Frame so you can inspect/manage it in JS (this probably requires platform specific implementations instead of cpp/ only)
class Frame: public jsi::HostObject {
public:
  Frame(void* frame): frame(frame) {}
  
public:
  /**
   * Represents the actual frame data this Frame wrapper holds. This has to be a void* to be platform independant, but will resolve to the following types:
   *
   * * iOS: [CMSampleBufferRef]
   * * Android: [Bitmap]
   */
  void* frame;
};


}
