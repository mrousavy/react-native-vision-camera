//
//  VisionCameraInstaller.h
//  Pods
//
//  Created by Marc Rousavy on 20.04.24.
//

#pragma once

#import "VisionCameraProxyDelegate.h"

NS_ASSUME_NONNULL_BEGIN

/**
 A static class to install/inject the VisionCameraProxy into the global JS runtime.
 */
@interface VisionCameraInstaller : NSObject

+ (BOOL)installWithDelegate:(id<VisionCameraProxyDelegate>)delegate;

@end

NS_ASSUME_NONNULL_END
