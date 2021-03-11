#include "JSIUtils.h"

FrameProcessorCallback convertJSIFunctionToFrameProcessorCallback(jsi::Runtime &runtime, const jsi::Function &value) {
  __block auto cb = value.getFunction(runtime);

  return ^(int todo__frame) {
    NSLog(@"Calling jsi::Function Frame Processor with param: %i..", todo__frame);
    cb.callWithThis(runtime, cb, jsi::Array::createWithElements(runtime, jsi::Value(todo__frame)), 1);
  };
}
