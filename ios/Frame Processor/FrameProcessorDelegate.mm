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

#import "../../cpp/Logger.h"
#import "../../cpp/MakeJSIRuntime.h"
#import "../../cpp/RuntimeDecorator.h"
#import "../JSI Utils/YeetJSIUtils.h"

#if !__has_include(<RNReanimated/NativeReanimatedModule.h>)
#error The NativeReanimatedModule.h header could not be found, make sure you install react-native-reanimated!
#endif

#import <RNReanimated/ShareableValue.h>
 
using namespace facebook;
//using namespace reanimated;

@implementation FrameProcessorDelegate {
  std::unique_ptr<jsi::Function> worklet;
  std::unique_ptr<jsi::Runtime> runtime;
}

@synthesize dispatchQueue;

- (instancetype) init {
  self = [super init];
  if (self) {
    // TODO: relativePriority 0 or -1?
    dispatch_queue_attr_t qos = dispatch_queue_attr_make_with_qos_class(DISPATCH_QUEUE_SERIAL, QOS_CLASS_USER_INTERACTIVE, -1);
    dispatchQueue = dispatch_queue_create("com.mrousavy.camera-frame-processor", qos);
    // TODO: Do I need to create the JSI runtime in the `dispatchQueue`'s Thread?

  }
  return self;
}

- (void) setFrameProcessorFunction:(void*)function {
  // TODO: Make sure this unique_ptr stuff works, because it seems like a very bad idea to move the jsi::Function and keep a strong reference
  worklet = std::unique_ptr<jsi::Function>(static_cast<jsi::Function*>(function));
  
  // TODO: Use ShareableValue::adapt without a NativeReanimatedModule instance?
  // auto workletShareable = reanimated::ShareableValue::adapt(*runtime, *worklet, reanimated::ValueType::UndefinedType);
  
  // TODO: Workletize the [worklet] using the Reanimated API
  //  1. Capture any variables/functions from "outside" the function (Copy over to this runtime & freeze)
  //  2. Make sure the user can assign Reanimated SharedValues in the worklet, no idea if this is already supported after step 1.
  
  // auto workletShareable = reanimated::ShareableValue::adapt(*runtime, worklet, reanimated::ValueType::UndefinedType);
}

- (void) captureOutput:(AVCaptureOutput *)output didOutputSampleBuffer:(CMSampleBufferRef)sampleBuffer fromConnection:(AVCaptureConnection *)connection {
  vision::Logger::log("FrameProcessorDelegate: Camera frame arrived");
  if (!runtime) {
    vision::Logger::log("FrameProcessorDelegate: Creating JSI Runtime...");
    auto start = std::chrono::system_clock::now();
    runtime = std::unique_ptr<jsi::Runtime>(vision::makeJSIRuntime());
    vision::RuntimeDecorator::decorateRuntime(*runtime);
    auto end = std::chrono::system_clock::now();
    auto elapsed = std::chrono::duration_cast<std::chrono::milliseconds>(end - start).count();
    std::string msg = "FrameProcessorDelegate: Runtime created! Took " + std::to_string(elapsed) + " seconds";
    vision::Logger::log(msg.c_str());
  }
  // TODO: Call [worklet] with the actual frame output buffer
  worklet->callWithThis(*runtime, *worklet, convertNSStringToJSIString(*runtime, @"Hello from VisionCamera!"), 1);
}

@end
