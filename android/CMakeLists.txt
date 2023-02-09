project(VisionCamera)
cmake_minimum_required(VERSION 3.4.1)

set (CMAKE_VERBOSE_MAKEFILE ON)
set (CMAKE_CXX_STANDARD 14)

include("${NODE_MODULES_DIR}/react-native/ReactAndroid/cmake-utils/folly-flags.cmake")
add_compile_options(${folly_FLAGS})


set (PACKAGE_NAME "VisionCamera")
set (BUILD_DIR ${CMAKE_SOURCE_DIR}/build)
# Consume shared libraries and headers from prefabs
find_package(fbjni REQUIRED CONFIG)
find_package(ReactAndroid REQUIRED CONFIG)
# VisionCamera shared

add_library(
        ${PACKAGE_NAME}
        SHARED
        src/main/cpp/VisionCamera.cpp
        src/main/cpp/JSIJNIConversion.cpp
        src/main/cpp/FrameHostObject.cpp
        src/main/cpp/FrameProcessorRuntimeManager.cpp
        src/main/cpp/CameraView.cpp
        src/main/cpp/VisionCameraScheduler.cpp
        src/main/cpp/java-bindings/JFrameProcessorPlugin.cpp
        src/main/cpp/java-bindings/JImageProxy.cpp
        src/main/cpp/java-bindings/JHashMap.cpp
)

# includes
target_include_directories(
        ${PACKAGE_NAME}
        PRIVATE
        "${NODE_MODULES_DIR}/react-native/ReactAndroid/src/main/jni/react/turbomodule"
        "${NODE_MODULES_DIR}/react-native/ReactCommon"
        "${NODE_MODULES_DIR}/react-native/ReactCommon/callinvoker"
        "${NODE_MODULES_DIR}/react-native/ReactCommon/jsi"
        "${NODE_MODULES_DIR}/react-native/ReactCommon/react/renderer/graphics/platform/cxx"
        "${NODE_MODULES_DIR}/react-native/ReactCommon/runtimeexecutor"
        "${NODE_MODULES_DIR}/react-native/ReactCommon/yoga"
        "src/main/cpp"
)


# find libraries

file (GLOB LIBRN_DIR "${BUILD_DIR}/react-native-0*/jni/${ANDROID_ABI}")

target_link_libraries(
        ${PACKAGE_NAME}
        ReactAndroid::folly_runtime
        ReactAndroid::glog
        ReactAndroid::jsi
        ReactAndroid::reactnativejni
        fbjni::fbjni
)

find_library(
        WORKLETS_LIB
        worklets
)

find_library(
        LOG_LIB
        log
)

# linking
message(WARNING "VisionCamera linking: FOR_HERMES=${FOR_HERMES}")
target_link_libraries(
        ${PACKAGE_NAME}
        ${LOG_LIB}
        ${JSI_LIB}
        ${WORKLETS_LIB}
        ${REACT_NATIVE_JNI_LIB}
        ${FBJNI_LIB}
        ${FOLLY_LIB}
        android
)
