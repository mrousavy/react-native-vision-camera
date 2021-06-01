//
//  FrameProcessorCallback.h
//  VisionCamera
//
//  Created by Marc Rousavy on 11.03.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

#pragma once

#import <Foundation/Foundation.h>
#import <CoreMedia/CMSampleBuffer.h>

typedef void (^FrameProcessorCallback) (CMSampleBufferRef buffer);
