///
/// AndroidAssetManager.hpp
/// VisionCamera
/// Copyright © 2026 Marc Rousavy @ Margelo
///

#pragma once

#include <android/asset_manager.h>
#include <fbjni/fbjni.h>

namespace margelo::nitro::camera::resizer::utils {

struct JAssetManager final : public facebook::jni::JavaClass<JAssetManager> {
  static constexpr auto kJavaDescriptor = "Landroid/content/res/AssetManager;";

  [[nodiscard]] AAssetManager* getAssetManager();
};

struct JAssetManagerFactory final : public facebook::jni::JavaClass<JAssetManagerFactory> {
  static constexpr auto kJavaDescriptor = "Lcom/margelo/nitro/camera/resizer/AssetManagerFactory;";

  [[nodiscard]] static facebook::jni::local_ref<JAssetManager> create();
};

class AndroidAssetManager final {
public:
  [[nodiscard]] static const AndroidAssetManager& getShared();

  AndroidAssetManager(const AndroidAssetManager&) = delete;
  AndroidAssetManager& operator=(const AndroidAssetManager&) = delete;

  [[nodiscard]] AAssetManager* get() const noexcept;

private:
  AndroidAssetManager();
  ~AndroidAssetManager();

private:
  facebook::jni::global_ref<JAssetManager::javaobject> _javaAssetManager;
  AAssetManager* _assetManager{nullptr};
};

} // namespace margelo::nitro::camera::resizer::utils
