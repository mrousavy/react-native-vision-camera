//
//  VisionCameraProxy.h
//  VisionCamera
//
//  Created by Marc Rousavy on 20.07.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

#pragma once

#import <Foundation/Foundation.h>
#import <React/RCTBridge.h>

#ifdef __cplusplus
#import "WKTJsiWorkletContext.h"
#import <ReactCommon/CallInvoker.h>
#import <jsi/jsi.h>

using namespace facebook;

class VisionCameraProxy : public jsi::HostObject {
public:
  explicit VisionCameraProxy(jsi::Runtime& runtime, std::shared_ptr<react::CallInvoker> callInvoker);
  ~VisionCameraProxy();

public:
  std::vector<jsi::PropNameID> getPropertyNames(jsi::Runtime& runtime) override;
  jsi::Value get(jsi::Runtime& runtime, const jsi::PropNameID& name) override;

  jsi::Runtime& getWorkletRuntime() {
    return _workletContext->getWorkletRuntime();
  }

private:
  void setFrameProcessor(jsi::Runtime& runtime, int viewTag, const jsi::Object& frameProcessor);
  void removeFrameProcessor(jsi::Runtime& runtime, int viewTag);
  jsi::Value initFrameProcessorPlugin(jsi::Runtime& runtime, std::string name, const jsi::Object& options);

private:
  std::shared_ptr<RNWorklet::JsiWorkletContext> _workletContext;
  std::shared_ptr<react::CallInvoker> _callInvoker;
};
#endif

NS_ASSUME_NONNULL_BEGIN

@interface VisionCameraProxyHolder : NSObject

- (_Nonnull instancetype)initWithProxy:(void*)proxy;

#ifdef __cplusplus
- (VisionCameraProxy*)proxy;
#endif

@end

@interface VisionCameraInstaller : NSObject

+ (BOOL)installToBridge:(RCTBridge*)bridge;

@end

NS_ASSUME_NONNULL_END
