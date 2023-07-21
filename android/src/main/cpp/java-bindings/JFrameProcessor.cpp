//
// Created by Marc Rousavy on 29.09.21.
//

#include "JFrameProcessor.h"

#include <jni.h>
#include <fbjni/fbjni.h>

namespace vision {

using namespace facebook;
using namespace jni;

local_ref<jobject> JFrameProcessorPlugin::callback(alias_ref<JImageProxy::javaobject> image,
                                                   alias_ref<JArrayClass<jobject>> params) const {
  auto callbackMethod = getClass()->getMethod<TCallback>("callback");

  auto result = callbackMethod(self(), image, params);
  return make_local(result);
}

std::string JFrameProcessorPlugin::getName() const {
  auto getNameMethod = getClass()->getMethod<jstring()>("getName");
  return getNameMethod(self())->toStdString();
}

} // namespace vision
