//
// Created by Marc Rousavy on 22.06.21.
//

#include "FrameProcessorPlugin.h"
#include <string>

namespace vision {

using namespace facebook;
using namespace jni;

using TSelf = local_ref<HybridClass<FrameProcessorPlugin>::jhybriddata>;
using TFrameProcessorPlugin = jobject(alias_ref<JImageProxy::javaobject>, alias_ref<JArrayClass<jobject>>);

TSelf vision::FrameProcessorPlugin::initHybrid(alias_ref<HybridClass::jhybridobject> jThis, const std::string& name) {
  return makeCxxInstance(jThis, name);
}

void FrameProcessorPlugin::registerNatives() {
  registerHybrid({
    makeNativeMethod("initHybrid",
                     FrameProcessorPlugin::initHybrid),
  });
}

local_ref<jobject> FrameProcessorPlugin::callback(alias_ref<JImageProxy::javaobject> image, alias_ref<JArrayClass<jobject>> params) {
  static const auto func = javaPart_->getClass()->getMethod<TFrameProcessorPlugin>("callback");
  auto result = func(javaPart_.get(), image, params);
  return make_local(result);
}

std::string FrameProcessorPlugin::getName() {
  return name;
}

} // namespace vision
