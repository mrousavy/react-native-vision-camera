//
// Created by Marc Rousavy on 29.09.21.
//

#include "JFrameProcessorPlugin.h"

#include <jni.h>
#include <fbjni/fbjni.h>

namespace vision {

using namespace facebook;
using namespace jni;

using TCallback = jobject(alias_ref<JFrame::javaobject>, alias_ref<jobject>);

local_ref<jobject> JFrameProcessorPlugin::callback(alias_ref<JFrame::javaobject> frame,
                                                   alias_ref<jobject> params) const {
  auto callbackMethod = getClass()->getMethod<TCallback>("callback");

  auto result = callbackMethod(self(), frame, params);
  return make_local(result);
}

std::string JFrameProcessorPlugin::getName() const {
  auto getNameMethod = getClass()->getMethod<jstring()>("getName");
  return getNameMethod(self())->toStdString();
}

} // namespace vision
