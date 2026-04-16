///
/// NativeBufferHelper.hpp
/// Copyright © Marc Rousavy @ Margelo
///

#include <fbjni/fbjni.h>

namespace margelo::nitro::camera {

using namespace facebook;

class NativeBufferHelper : public jni::HybridClass<NativeBufferHelper> {
public:
  static jlong getHardwareBufferPointer(jni::alias_ref<jni::JClass> clazz, jni::alias_ref<jni::JObject> hardwareBufferBoxed);
  static void releaseHardwareBufferPointer(jni::alias_ref<jni::JClass> clazz, jlong hardwareBufferPointer);

public:
  static auto constexpr kJavaDescriptor = "Lcom/margelo/nitro/camera/utils/NativeBufferHelper;";
  static void registerNatives() {
    registerHybrid({
        makeNativeMethod("getHardwareBufferPointer", NativeBufferHelper::getHardwareBufferPointer),
        makeNativeMethod("releaseHardwareBufferPointer", NativeBufferHelper::releaseHardwareBufferPointer),
    });
  }

private:
  friend HybridBase;
};

} // namespace margelo::nitro::camera
