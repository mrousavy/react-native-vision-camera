///
/// JSIConverter+AsyncQueue.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

#pragma once

#include <NitroModules/JSIConverter.hpp>
#include <jsi/jsi.h>
#if __has_include(<worklets/RunLoop/AsyncQueue.h>)
#include <worklets/RunLoop/AsyncQueue.h>
#elif __has_include(<RNWorklets/worklets/RunLoop/AsyncQueue.h>)
#include <RNWorklets/worklets/RunLoop/AsyncQueue.h>
#else
#error react-native-worklets Prefab not found!
#endif

namespace margelo::nitro {

// JSIConverter<std::shared_ptr<worklets::AsyncQueue>> is implemented
// in JSIConverter<std::shared_ptr<jsi::NativeState>>

}
