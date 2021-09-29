//
// Created by Marc Rousavy on 29.09.21
//

#pragma once

#include <jni.h>
#include <fbjni/fbjni.h>
#include <string>

#include "JImageProxy.h"

namespace vision {

using namespace facebook;
using namespace jni;

struct JFrameProcessorPlugin : public JavaClass<JFrameProcessorPlugin> {
  static constexpr auto kJavaDescriptor = "Lcom/mrousavy/camera/frameprocessor/FrameProcessorPlugin;";

 public:
  /**
   * Call the plugin.
   */
  local_ref<jobject> callback(alias_ref<JImageProxy::javaobject> image,
                              alias_ref<JArrayClass<jobject>> params) const;
  /**
   * Get the user-defined name of the Frame Processor Plugin
   */
  std::string getName() const;
};

} // namespace vision
