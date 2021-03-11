#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>
#import "FrameProcessorCallback.h"

#ifndef __cplusplus
#error JSIUtil.h has to be compiled with C++!
#endif

#import <jsi/jsi.h>

using namespace facebook;

FrameProcessorCallback convertJSIFunctionToFrameProcessorCallback(jsi::Runtime &runtime, const jsi::Function &value);
