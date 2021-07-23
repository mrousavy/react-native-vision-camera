//
//  JSConsoleMirrorInstaller.cpp
//  VisionCamera
//
//  Created by Marc Rousavy on 23.07.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

#include "JSConsoleMirrorInstaller.h"
#include <jsi/jsi.h>
#include <React-callinvoker/ReactCommon/CallInvoker.h>
#include <RNReanimated/RuntimeManager.h>

namespace vision {

using namespace facebook;

void installJSConsoleMirror(jsi::Runtime* originalRuntime,
                            std::weak_ptr<reanimated::RuntimeManager> mirrorRuntimeManager,
                            std::weak_ptr<react::CallInvoker> callInvoker) {
  if (!originalRuntime) return;
  if (mirrorRuntimeManager.expired()) return;
  if (callInvoker.expired()) return;
  
  auto logMirror = [callInvoker, originalRuntime, mirrorRuntimeManager](const char* logFuncName,
                                                                        const jsi::Value* args,
                                                                        size_t argsCount) {
    auto strongCallInvoker = callInvoker.lock();
    if (!strongCallInvoker) return;
    
    if (!originalRuntime) return;
    
    auto runtimeManager = mirrorRuntimeManager.lock();
    if (!runtimeManager) return;
    
    std::vector<std::shared_ptr<reanimated::ShareableValue>> arguments(argsCount);
    for (size_t i = 0; i < argsCount; i++) {
      auto sharedValue = reanimated::ShareableValue::adapt(*originalRuntime, args[i], runtimeManager.get());
      arguments.push_back(sharedValue);
    }
    
    strongCallInvoker->invokeSync([originalRuntime, arguments, argsCount, logFuncName]() {
      if (!originalRuntime) return;
      auto& runtime = *originalRuntime;
      
      jsi::Value* adaptedArgs = new jsi::Value[argsCount];
      for (size_t i = 0; i < argsCount; i++) {
        auto& sharedValue = arguments[i];
        adaptedArgs[i] = sharedValue->getValue(runtime);
      }
      
      auto console = runtime.global().getPropertyAsObject(runtime, "console");
      auto logFunc = console.getPropertyAsFunction(runtime, logFuncName);
      
      const jsi::Value* cargs = adaptedArgs;
      logFunc.call(runtime, cargs, argsCount);
      
      delete[] adaptedArgs;
    });
  };
  
  auto& runtimeManager = *mirrorRuntimeManager.lock();
  auto& mirrorRuntime = *runtimeManager.runtime;
  auto console = jsi::Object(mirrorRuntime);
  
  const std::vector<const char*> logFunctionNames{ "log", "info", "error", "warn", "trace", "debug" };
  for (auto& logFunctionName : logFunctionNames) {
    // Create mirror log function
    auto func = jsi::Function::createFromHostFunction(mirrorRuntime,
                                                      jsi::PropNameID::forUtf8(mirrorRuntime, logFunctionName),
                                                      1,
                                                      [logMirror, logFunctionName](jsi::Runtime& runtime,
                                                                                   const jsi::Value& thisValue,
                                                                                   const jsi::Value* arguments,
                                                                                   size_t count) -> jsi::Value {
      logMirror(logFunctionName, arguments, count);
      return jsi::Value::undefined();
    });
    console.setProperty(mirrorRuntime, logFunctionName, func);
  }
  
  mirrorRuntime.global().setProperty(mirrorRuntime, "console", console);
}

}
