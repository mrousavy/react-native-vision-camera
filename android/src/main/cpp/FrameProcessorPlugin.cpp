//
// Created by Marc Rousavy on 22.06.21.
//

#include "FrameProcessorPlugin.h"

namespace vision {

using namespace facebook;
using namespace jni;

using TSelf = local_ref<HybridClass<FrameProcessorPlugin>::jhybriddata>;

TSelf vision::FrameProcessorPlugin::initHybrid(alias_ref<HybridClass::jhybridobject> jThis, const std::string& name) {
  return makeCxxInstance(jThis, name);
}

void FrameProcessorPlugin::registerNatives() {
  registerHybrid({
    makeNativeMethod("initHybrid",
                     FrameProcessorPlugin::initHybrid),
  });
}

jobject FrameProcessorPlugin::callback(alias_ref<JImageProxy::javaobject> image) {
  static const auto func = javaPart_->getClass()->getMethod<jobject(alias_ref<JImageProxy::javaobject>)>("callback");
  auto result = func(javaPart_.get(), image);
  return result.get();
}

std::string FrameProcessorPlugin::getName() {
  return name;
}

} // namespace vision
