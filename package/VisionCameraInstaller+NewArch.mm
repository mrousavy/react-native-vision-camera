//
//  VisionCameraInstaller.mm
//  DoubleConversion
//
//  Created by Marc Rousavy on 20.04.24.
//

#ifdef RCT_NEW_ARCH_ENABLED

#import "VisionCameraInstaller.h"
#import "VisionCameraProxy.h"
#import <Foundation/Foundation.h>

#import <React/RCTBridge+Private.h>
#import <React/RCTBridge.h>
#import <ReactCommon/RCTTurboModuleManager.h>

@implementation VisionCameraInstaller

+ (BOOL)installWithDelegate:(id<VisionCameraProxyDelegate>)delegate {
  @throw [NSException exceptionWithName:@"FrameProcessorsNotAvailableException"
                                   reason:@"Frame Processors are not available yet on the new architecture."
                                 userInfo:nil];
  return NO;
}

@end

#endif
