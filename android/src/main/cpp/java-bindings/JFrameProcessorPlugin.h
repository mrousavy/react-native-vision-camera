//
// Created by Marc Rousavy on 29.09.21
//

#pragma once

#include <jni.h>
#include <fbjni/fbjni.h>
#include <string>
#include <react/jni/ReadableNativeMap.h>

#include "JFrame.h"

namespace vision {

using namespace facebook;
using namespace jni;

struct JFrameProcessorPlugin : public JavaClass<JFrameProcessorPlugin> {
  static constexpr auto kJavaDescriptor = "Lcom/mrousavy/camera/frameprocessor/FrameProcessorPlugin;";

 public:
  /**
   * Call the plugin.
   */
  local_ref<jobject> callback(const alias_ref<JFrame::javaobject>& frame,
                              const alias_ref<react::ReadableNativeMap::javaobject>& params) const;
};

} // namespace vision
