#pragma once

#include <unistd.h>
#include <memory>
#include <vector>
#include <thread>
#include <unordered_map>

#include <React-callinvoker/ReactCommon/CallInvoker.h>
#include <jsi/jsi.h>

using namespace facebook;

namespace vision
{
  class WorkletManager
  {
  public:
    WorkletManager();
    virtual ~WorkletManager();

    jsi::Value spawnThread(jsi::Runtime &rt, const jsi::Value &operations);
  public:
    struct RuntimeThread {
      std::unique_ptr<jsi::Runtime> runtime;
      std::shared_ptr<std::thread> thread;
    };
    int currentThreadId = 0;
    std::unordered_map<int, std::shared_ptr<RuntimeThread>> threads;
  };

} // namespace vision
