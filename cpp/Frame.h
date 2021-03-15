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

class Frame: public jsi::HostObject {
public:
  Frame(void* frame);
  
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
