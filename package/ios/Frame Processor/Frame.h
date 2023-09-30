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

@property(nonatomic, readonly) CMSampleBufferRef _Nonnull buffer;
@property(nonatomic, readonly) UIImageOrientation orientation;

@end
