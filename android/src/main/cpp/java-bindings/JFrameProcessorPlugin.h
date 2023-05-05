//
// Created by Marc Rousavy on 29.09.21
//

#pragma once

#include <jni.h>
#include <fbjni/fbjni.h>
#include <string>

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
  local_ref<jobject> callback(alias_ref<JFrame::javaobject> frame,
                              alias_ref<JArrayClass<jobject>> params) const;
  /**
   * Get the user-defined name of the Frame Processor Plugin
   */
  std::string getName() const;
};

} // namespace vision
