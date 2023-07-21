//
// Created by Marc Rousavy on 29.09.21.
//

#include "JFrameProcessorPlugin.h"

#include <jni.h>
#include <fbjni/fbjni.h>

namespace vision {

using namespace facebook;
using namespace jni;

using TCallback = jobject(alias_ref<JFrame::javaobject>, alias_ref<react::ReadableNativeMap::javaobject> params);

local_ref<jobject> JFrameProcessorPlugin::callback(const alias_ref<JFrame::javaobject>& frame,
                                                   const alias_ref<react::ReadableNativeMap::javaobject>& params) const {
  auto callbackMethod = getClass()->getMethod<TCallback>("callback");

  auto result = callbackMethod(self(), frame, params);
  return make_local(result);
}

} // namespace vision
