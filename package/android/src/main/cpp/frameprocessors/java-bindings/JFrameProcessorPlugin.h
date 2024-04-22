//
// Created by Marc Rousavy on 29.09.21
//

#pragma once

#include <fbjni/fbjni.h>
#include <jni.h>
#include <string>

#include "JFrame.h"

namespace vision {

using namespace facebook;
using namespace jni;

struct JFrameProcessorPlugin : public JavaClass<JFrameProcessorPlugin> {
  static constexpr auto kJavaDescriptor = "Lcom/mrousavy/camera/frameprocessors/FrameProcessorPlugin;";

public:
  /**
   * Call the plugin.
   */
  local_ref<jobject> callback(const alias_ref<JFrame::javaobject>& frame, const alias_ref<JMap<jstring, jobject>>& params) const;
};

} // namespace vision
