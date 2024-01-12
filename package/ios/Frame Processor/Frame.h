//
//  Frame.h
//  VisionCamera
//
//  Created by Marc Rousavy on 15.03.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

#pragma once

#import <CoreMedia/CMSampleBuffer.h>
#import <Foundation/Foundation.h>
#import <UIKit/UIImage.h>

@interface Frame : NSObject

- (instancetype _Nonnull)initWithBuffer:(CMSampleBufferRef _Nonnull)buffer orientation:(UIImageOrientation)orientation;

- (instancetype)init NS_UNAVAILABLE;

@property(nonatomic, readonly) CMSampleBufferRef _Nonnull buffer;
@property(nonatomic, readonly) UIImageOrientation orientation;

// Getters
- (NSString* _Nonnull)pixelFormat;
- (BOOL)isMirrored;
- (BOOL)isValid;
- (size_t)width;
- (size_t)height;
- (double)timestamp;
- (size_t)bytesPerRow;
- (size_t)planesCount;

@end
