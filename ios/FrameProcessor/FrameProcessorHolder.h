//
//  FrameProcessorHolder.h
//  VisionCamera
//
//  Created by Marc Rousavy on 27.02.21.
//  Copyright © 2021 Facebook. All rights reserved.
//

#pragma once

@interface FrameProcessorHolder : NSObject

@property (strong, nonatomic) dispatch_queue_t dispatchQueue;

@end
