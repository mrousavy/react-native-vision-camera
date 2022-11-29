//
//  SkiaFrameDrawContext.h
//  VisionCamera
//
//  Created by Marc Rousavy on 29.11.22.
//  Copyright © 2022 mrousavy. All rights reserved.
//

#ifndef SkiaFrameDrawContext_h
#define SkiaFrameDrawContext_h

#include "SkImageHelpers.h"
#include <include/core/SkCanvas.h>
#include <memory>

struct SkiaFrameDrawContext {
  sk_sp<SkCanvas> canvas;
  std::shared_ptr<SkImageHelpers> imageHelpers;
  
  SkiaFrameDrawContext(sk_sp<SkCanvas> c,
                       std::shared_ptr<SkImageHelpers> i):
  canvas(c), imageHelpers(i) {}
};

#endif /* SkiaFrameDrawContext_h */
