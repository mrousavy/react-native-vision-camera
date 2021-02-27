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
  
jsi::Value NativeReanimatedModule::spawnThread(jsi::Runtime &rt, const jsi::Value &operations) {
  auto object = operations.asObject(rt);

  if (!object.isFunction(rt) || object.getProperty(rt, "__worklet").isUndefined()) {
    // TODO: Throw error "Function passed to spawnThread doesn't seem to be a worklet"
    return jsi::Value::undefined();
  }

  const int threadId = ++this->currentThreadId;

  std::shared_ptr<ShareableValue> workletShareable = ShareableValue::adapt(rt, operations, this, ValueType::UndefinedType, threadId);

  std::shared_ptr<RuntimeThread> runtimeThread = std::make_shared<RuntimeThread>();
  this->threads.insert(std::make_pair(threadId, runtimeThread));

  auto job = [=]() {
    std::unique_ptr<jsi::Runtime> customRuntime = makeJSIRuntime();
    std::shared_ptr<Th> th = this->threads.at(threadId);
    th->rt = std::move(customRuntime);
    RuntimeDecorator::decorateCustomThread(*th->rt);
    jsi::Value result = jsi::Value::undefined();

    jsi::Function func = workletShareable->getValue(*th->rt, threadId).asObject(*th->rt).asFunction(*th->rt);
    std::shared_ptr<jsi::Function> funcPtr = std::make_shared<jsi::Function>(std::move(func));
    try {
      result = funcPtr->callWithThis(*th->rt, *funcPtr);
    }
    catch (std::exception &e) {
      std::string str = e.what();
      errorHandler->setError(str);
      errorHandler->raise();
    }
    return result;
  };

  threads.at(threadId)->thread = std::make_shared<std::thread>(job);
  return jsi::Value::undefined();
}

void NativeReanimatedModule::onEvent(std::string eventName, std::string eventAsString)
{
   try
    {
      eventHandlerRegistry->processEvent(*runtime, eventName, eventAsString);
      mapperRegistry->execute(*runtime);
      if (mapperRegistry->needRunOnRender())
      {
        maybeRequestRender();
      }
    }
    catch (...)
    {
      if (!errorHandler->raise())
      {
        throw;
      }
    }
}

bool NativeReanimatedModule::isAnyHandlerWaitingForEvent(std::string eventName) {
  return eventHandlerRegistry->isAnyHandlerWaitingForEvent(eventName);
}


void NativeReanimatedModule::maybeRequestRender()
{
  if (!renderRequested)
  {
    renderRequested = true;
    requestRender([this](double timestampMs) {
      this->renderRequested = false;
      this->onRender(timestampMs);
    }, *this->runtime);
  }
}

void NativeReanimatedModule::onRender(double timestampMs)
{
  try
  {
    std::vector<FrameCallback> callbacks = frameCallbacks;
    frameCallbacks.clear();
    for (auto callback : callbacks)
    {
      callback(timestampMs);
    }
    mapperRegistry->execute(*runtime);

    if (mapperRegistry->needRunOnRender())
    {
      maybeRequestRender();
    }
  }
  catch (...)
  {
    if (!errorHandler->raise())
    {
      throw;
    }
  }
}

NativeReanimatedModule::~NativeReanimatedModule()
{
  StoreUser::clearStore();
}

} // namespace vision
