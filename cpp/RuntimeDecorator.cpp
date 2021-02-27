#include "RuntimeDecorator.h"
#include "Logger.h"
#include <unordered_map>
#include <memory>

namespace reanimated {

void RuntimeDecorator::decorateRuntime(jsi::Runtime &rt) {
  rt.global().setProperty(rt, "_WORKLET", jsi::Value(true));

  jsi::Object dummyGlobal(rt);
  auto workletInit = [](
     jsi::Runtime &rt,
     const jsi::Value &thisValue,
     const jsi::Value *args,
     size_t count
     ) -> jsi::Value {
   return jsi::Value::undefined();
  };
  dummyGlobal.setProperty(rt, "__reanimatedWorkletInit", jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, "__reanimatedWorkletInit"), 1, workletInit));

  rt.global().setProperty(rt, "global", dummyGlobal);

  rt.global().setProperty(rt, "jsThis", jsi::Value::undefined());

  auto log = [](
      jsi::Runtime &rt,
      const jsi::Value &thisValue,
      const jsi::Value *args,
      size_t count
      ) -> jsi::Value {
    const jsi::Value *value = &args[0];
    if (value->isString()) {
      Logger::log(value->getString(rt).utf8(rt).c_str());
    } else if (value->isNumber()) {
      Logger::log(value->getNumber());
    } else if (value->isUndefined()) {
      Logger::log("undefined");
    } else {
      Logger::log("unsupported value type");
    }
    return jsi::Value::undefined();
  };
	rt.global().setProperty(rt, "_log", jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, "_log"), 1, log));

  auto setGlobalConsole = [](
      jsi::Runtime &rt,
      const jsi::Value &thisValue,
      const jsi::Value *args,
      size_t count
      ) -> jsi::Value {
    rt.global().setProperty(rt, "console", args[0]);
    return jsi::Value::undefined();
  };
  rt.global().setProperty(rt, "_setGlobalConsole", jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, "_setGlobalConsole"), 1, setGlobalConsole));
}

}
