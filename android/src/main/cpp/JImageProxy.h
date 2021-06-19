//
// Created by Marc on 19/06/2021.
//

#pragma once

#include <jni.h>
#include <fbjni/fbjni.h>

struct JImageProxy : facebook::jni::JavaClass<JImageProxy> {
  static constexpr auto kJavaDescriptor = "Landroidx.camera.core/ImageProxy;";
};