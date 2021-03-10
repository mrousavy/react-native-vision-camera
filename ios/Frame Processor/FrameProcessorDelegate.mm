//
//  FrameProcessorDelegate.mm
//  VisionCamera
//
//  Created by Marc Rousavy on 27.02.21.
//  Copyright © 2021 Facebook. All rights reserved.
//

#import "FrameProcessorDelegate.h"
#import <Foundation/Foundation.h>
#import <jsi/jsi.h>

#import "../../cpp/MakeJSIRuntime.h"
#import "../JSI Utils/YeetJSIUtils.h"

#if !__has_include(<RNReanimated/NativeReanimatedModule.h>)
#error The NativeReanimatedModule.h header could not be found, make sure you install react-native-reanimated!
#endif

#import <RNReanimated/NativeReanimatedModule.h>
#import <RNReanimated/RuntimeManager.h>
#import <RNReanimated/ShareableValue.h>
#import <RNReanimated/RuntimeDecorator.h>
#import <RNReanimated/REAIOSErrorHandler.h>
#import <RNReanimated/REAIOSScheduler.h>

#import <ReactCommon/RCTTurboModuleManager.h>
 
using namespace facebook;
//using namespace reanimated;

@implementation FrameProcessorDelegate {
  //std::shared_ptr<reanimated::ShareableValue> worklet;
  std::shared_ptr<jsi::Function> worklet;
  std::unique_ptr<reanimated::RuntimeManager> runtimeManager;
}

@synthesize dispatchQueue;

- (instancetype) initWithBridge:(RCTBridge *)bridge {
  self = [super init];
  if (self) {
    NSLog(@"FrameProcessorDelegate: init()");
    // TODO: relativePriority 0 or -1?
    dispatch_queue_attr_t qos = dispatch_queue_attr_make_with_qos_class(DISPATCH_QUEUE_SERIAL, QOS_CLASS_USER_INTERACTIVE, -1);
    dispatchQueue = dispatch_queue_create("com.mrousavy.camera-frame-processor", qos);
    
    NSLog(@"FrameProcessorDelegate: Creating Runtime Manager...");
    
    auto start = std::chrono::system_clock::now();
    auto runtime = vision::makeJSIRuntime();
    reanimated::RuntimeDecorator::decorateRuntime(*runtime);
    auto scheduler = std::make_shared<reanimated::REAIOSScheduler>(bridge.jsCallInvoker);
    runtimeManager = std::make_unique<reanimated::RuntimeManager>(std::move(runtime),
                                                                  std::make_shared<reanimated::REAIOSErrorHandler>(scheduler),
                                                                  scheduler);
    auto end = std::chrono::system_clock::now();
    auto elapsed = std::chrono::duration_cast<std::chrono::milliseconds>(end - start).count();
    NSLog(@"FrameProcessorDelegate: Runtime Manager created! Took %lld seconds", elapsed);
  }
  return self;
}

- (void)dealloc {
  NSLog(@"FrameProcessorDelegate: dealloc()");
}

- (void) setFrameProcessorFunction:(void*)function {
  NSLog(@"FrameProcessorDelegate: Setting frame processor function!");
  // TODO: Make sure this unique_ptr stuff works, because it seems like a very bad idea to move the jsi::Function and keep a strong reference

  auto& rt = *runtimeManager->runtime;
  auto& funcRef = *static_cast<jsi::Value*>(function);
  auto shareableValue = reanimated::ShareableValue::adapt(rt, funcRef, runtimeManager.get());
  worklet = std::make_shared<jsi::Function>(shareableValue->getValue(rt).asObject(rt).asFunction(rt));
}

- (void) captureOutput:(AVCaptureOutput *)output didOutputSampleBuffer:(CMSampleBufferRef)sampleBuffer fromConnection:(AVCaptureConnection *)connection {
  NSLog(@"FrameProcessorDelegate: Camera frame arrived");
  if (runtimeManager->runtime == nullptr) {
    NSLog(@"Warning: Frame Processor was called, but the jsi::Runtime was null!");
    return;
  }
  if (worklet == nullptr) {
    NSLog(@"Warning: Frame Processor was called, but the Worklet was null!");
    return;
  }
  // TODO: Call [worklet] with the actual frame output buffer
  worklet->callWithThis(*runtimeManager->runtime, *worklet, convertNSStringToJSIString(*runtimeManager->runtime, @"Hello from VisionCamera!"), 1);
}

@end
