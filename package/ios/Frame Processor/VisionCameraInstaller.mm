//
//  VisionCameraInstaller.mm
//  DoubleConversion
//
//  Created by Marc Rousavy on 20.04.24.
//

#import <Foundation/Foundation.h>
#import "VisionCameraInstaller.h"
#import "VisionCameraProxy.h"

#import <React/RCTBridge+Private.h>
#import <React/RCTBridge.h>
#import <ReactCommon/RCTTurboModuleManager.h>

@implementation VisionCameraInstaller

+ (BOOL)installWithDelegate:(id<VisionCameraProxyDelegate>)delegate {
  // TODO: Migrate away from RCTBridge to support new arch.
  RCTBridge* bridge = delegate.getBridge;
  RCTCxxBridge* cxxBridge = (RCTCxxBridge*)bridge;
  if (!cxxBridge.runtime) {
    return NO;
  }

  jsi::Runtime& runtime = *(jsi::Runtime*)cxxBridge.runtime;

  // global.VisionCameraProxy
  auto visionCameraProxy = std::make_shared<VisionCameraProxy>(runtime, bridge.jsCallInvoker, delegate);
  runtime.global().setProperty(runtime, "VisionCameraProxy", jsi::Object::createFromHostObject(runtime, visionCameraProxy));

  return YES;
}

@end
