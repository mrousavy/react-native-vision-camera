//
//  FrameProcessorDelegate.h
//  VisionCamera
//
//  Created by Marc Rousavy on 27.02.21.
//  Copyright © 2021 Facebook. All rights reserved.
//

#pragma once

#import <AVFoundation/AVFoundation.h>

@interface FrameProcessorDelegate : NSObject<AVCaptureVideoDataOutputSampleBufferDelegate>

@property (strong, nonatomic) dispatch_queue_t dispatchQueue;

// Has to be void* because I can't use the C++ type jsi::Function in Objective-C/Swift/C.
- (void) setFrameProcessorFunction:(void*)function;

@end
