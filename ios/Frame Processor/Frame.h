//
//  Frame.h
//  VisionCamera
//
//  Created by Marc Rousavy on 15.03.21.
//  Copyright © 2021 Facebook. All rights reserved.
//

#pragma once

#import <CoreMedia/CMSampleBuffer.h>

// TODO: Make this Objective-C so it can be imported in Swift?
class Frame {
 public:
  explicit Frame(CMSampleBufferRef buffer): buffer(buffer) {}

 public:
  CMSampleBufferRef buffer;
};
