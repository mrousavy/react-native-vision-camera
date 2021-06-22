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
  // noop
}

void FrameProcessorPlugin::callback(const local_ref<jobject>& image) {
  static const auto func = javaPart_->getClass()->getMethod<void(local_ref<jobject>)>("callback");
  func(javaPart_.get(), image);
}

std::string FrameProcessorPlugin::getName() {
  return name;
}

} // namespace vision
