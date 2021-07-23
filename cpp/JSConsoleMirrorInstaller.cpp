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
  
  auto log = [callInvoker, originalRuntime](const char* logFuncName, const jsi::Value* args, size_t argsCount) {
    auto strongArgs = std::move(args);
    
    auto strongCallInvoker = callInvoker.lock();
    if (!strongCallInvoker) return;
    strongCallInvoker->invokeSync([originalRuntime, strongArgs, argsCount, logFuncName]() {
      if (!originalRuntime) return;
      auto& runtime = *originalRuntime;
      
      auto console = runtime.global().getPropertyAsObject(runtime, "console");
      auto logFunc = console.getPropertyAsFunction(runtime, logFuncName);
      logFunc.call(runtime, strongArgs, argsCount);
    });
  };
  
  auto& runtimeManager = *mirrorRuntimeManager.lock();
  auto& mirrorRuntime = *runtimeManager.runtime;
  auto console = jsi::Object(mirrorRuntime);
  
  const std::vector<const char*> logFunctionNames{ "log", "info", "error", "warn", "trace", "debug", "fatal" };
  for (auto& logFunctionName : logFunctionNames) {
    // Create mirror log function
    auto func = jsi::Function::createFromHostFunction(mirrorRuntime,
                                                      jsi::PropNameID::forUtf8(mirrorRuntime, logFunctionName),
                                                      1,
                                                      [log, logFunctionName](jsi::Runtime& runtime,
                                                                             const jsi::Value& thisValue,
                                                                             const jsi::Value* arguments,
                                                                             size_t count) -> jsi::Value {
      log(logFunctionName, arguments, count);
      return jsi::Value::undefined();
    });
    console.setProperty(mirrorRuntime, logFunctionName, func);
  }
  
  mirrorRuntime.global().setProperty(mirrorRuntime, "console", console);
}

}
