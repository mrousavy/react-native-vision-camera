//
//  UIImageOrientation+descriptor.h
//  VisionCamera
//
//  Created by Marc Rousavy on 29.12.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

#pragma once

#import <Foundation/Foundation.h>
#import <UIKit/UIImage.h>

@interface NSString (UIImageOrientationJSDescriptor)

+ (NSString*)stringWithParsed:(UIImageOrientation)orientation;

@end

@implementation NSString (UIImageOrientationJSDescriptor)

+ (NSString*)stringWithParsed:(UIImageOrientation)orientation {
  switch (orientation) {
    case UIImageOrientationUp:
    case UIImageOrientationUpMirrored:
      return @"portrait";
    case UIImageOrientationDown:
    case UIImageOrientationDownMirrored:
      return @"portrait-upside-down";
    case UIImageOrientationLeft:
    case UIImageOrientationLeftMirrored:
      // UIImageOrientation represents offset, we represent actual translation
      return @"landscape-right";
    case UIImageOrientationRight:
    case UIImageOrientationRightMirrored:
      // UIImageOrientation represents offset, we represent actual translation
      return @"landscape-left";
  }
}

@end
