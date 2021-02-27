#include "WorkletManager.h"

#include "Logger.h"
#include "SpeedChecker.h"
#include "MakeJSIRuntime.h"
#include "RuntimeDecorator.h"

#include <functional>
#include <thread>
#include <future>
#include <memory>

using namespace facebook;

namespace vision
{
  
  jsi::Value WorkletManager::spawnThread(jsi::Runtime &rt, const jsi::Value &operations) {
    auto object = operations.asObject(rt);
    
    if (!object.isFunction(rt) || object.getProperty(rt, "__worklet").isUndefined()) {
      // TODO: Throw error "Function passed to spawnThread doesn't seem to be a worklet"
      return jsi::Value::undefined();
    }
    
    const int threadId = ++this->currentThreadId;
    
    
    //std::shared_ptr<ShareableValue> workletShareable = ShareableValue::adapt(rt, operations, this, ValueType::UndefinedType, threadId);
    auto func = std::make_shared<jsi::Function>(object.asFunction(rt));
    
    std::shared_ptr<RuntimeThread> runtimeThread = std::make_shared<RuntimeThread>();
    this->threads.insert(std::make_pair(threadId, runtimeThread));
    
    auto job = [=]() {
      std::unique_ptr<jsi::Runtime> customRuntime = makeJSIRuntime();
      std::shared_ptr<RuntimeThread> th = this->threads.at(threadId);
      th->runtime = std::move(customRuntime);
      RuntimeDecorator::decorateRuntime(*th->runtime);
      
      try {
        return func->callWithThis(*th->runtime, *func);
      }
      catch (std::exception &e) {
        std::string what = e.what();
        throw jsi::JSError(*customRuntime, what);
        // TODO: Better error handling
      }
    };
    
    threads.at(threadId)->thread = std::make_shared<std::thread>(job);
    return jsi::Value::undefined();
  }
  
  WorkletManager::~WorkletManager()
  {
    for (auto thread : this->threads) {
      thread.second.reset();
    }
  }
  
} // namespace vision
