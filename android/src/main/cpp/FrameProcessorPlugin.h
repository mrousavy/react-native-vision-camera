//
// Created by Marc Rousavy on 22.06.21.
//

#pragma once

#include <jni.h>
#include <fbjni/fbjni.h>

namespace vision {

using namespace facebook;
using namespace jni;

class FrameProcessorPlugin: public HybridClass<FrameProcessorPlugin> {
public:
  static auto constexpr kJavaDescriptor = "Lcom/mrousavy/camera/frameprocessor/FrameProcessorPlugin;";
  static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jhybridobject> jThis,
                                                const std::string& name);
  static void registerNatives();

  void callback(const local_ref<jobject>& image);
  std::string getName();

private:
  friend HybridBase;
  jni::global_ref<FrameProcessorPlugin::javaobject> javaPart_;
  std::string name;

  FrameProcessorPlugin(alias_ref<FrameProcessorPlugin::jhybridobject> jThis,
                       std::string name): javaPart_(make_global(jThis)),
                       name(name)
  {}
};

} // namespace vision