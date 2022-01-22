//
//  Frame.h
//  VisionCamera
//
//  Created by Marc Rousavy on 15.03.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

#pragma once

#import <Foundation/Foundation.h>
#import <CoreMedia/CMSampleBuffer.h>
#import <UIKit/UIImage.h>

@interface Frame : NSObject

- (nonnull instancetype) initWithBuffer:(nonnull CMSampleBufferRef)buffer orientation:(UIImageOrientation)orientation;

- (nonnull instancetype) initWithBufferAndDepth:(nonnull CMSampleBufferRef)buffer depth:(nullable CVPixelBufferRef)depth orientation:(UIImageOrientation)orientation;

@property (nonatomic, readonly, nonnull) CMSampleBufferRef buffer;
@property (nonatomic, readonly, nullable) CVPixelBufferRef depth;
@property (nonatomic, readonly) UIImageOrientation orientation;

@end
