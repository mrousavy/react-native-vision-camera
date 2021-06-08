//
//  CMSampleBufferRefHolder.h
//  VisionCamera
//
//  Created by Marc Rousavy on 15.03.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

#pragma once

#import <Foundation/Foundation.h>
#import <CoreMedia/CMSampleBuffer.h>

@interface CMSampleBufferRefHolder : NSObject {
  CMSampleBufferRef buffer;
}

- (instancetype) initWithBuffer:(CMSampleBufferRef)buffer;

@property (nonatomic) CMSampleBufferRef buffer;

@end
