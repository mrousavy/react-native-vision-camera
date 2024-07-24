//
//  FrameProcessor.mm
//  VisionCamera
//
//  Created by Marc Rousavy on 13.07.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

#import "FrameProcessor.h"
#import <Foundation/Foundation.h>

#import "FrameHostObject.h"
#import "WKTJsiWorklet.h"
#import <jsi/jsi.h>
#import <memory>
#import "JSINSObjectConversion.h"

using namespace facebook;

@implementation FrameProcessor {
  std::shared_ptr<RNWorklet::JsiWorkletContext> _workletContext;
  std::shared_ptr<RNWorklet::WorkletInvoker> _workletInvoker;
}

- (instancetype)initWithWorklet:(std::shared_ptr<RNWorklet::JsiWorklet>)worklet
                        context:(std::shared_ptr<RNWorklet::JsiWorkletContext>)context {
  if (self = [super init]) {
    _workletInvoker = std::make_shared<RNWorklet::WorkletInvoker>(worklet);
    _workletContext = context;
  }
  return self;
}

- (void)call:(Frame* _Nonnull)frame {
  // Call the Frame Processor on the Worklet Runtime
  jsi::Runtime& runtime = _workletContext->getWorkletRuntime();

  // Wrap HostObject as JSI Value
  jsi::Value jsValue = JSINSObjectConversion::convertObjCObjectToJSIValue(runtime, frame);

  // Call the Worklet with the Frame JS Host Object as an argument
  _workletInvoker->call(runtime, jsi::Value::undefined(), &jsValue, 1);
}

@end
