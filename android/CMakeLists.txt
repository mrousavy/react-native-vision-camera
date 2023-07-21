project(VisionCamera)
cmake_minimum_required(VERSION 3.9.0)

set(CMAKE_VERBOSE_MAKEFILE ON)
set(PACKAGE_NAME "VisionCamera")
set(BUILD_DIR ${CMAKE_SOURCE_DIR}/build)
set(CMAKE_VERBOSE_MAKEFILE ON)
set(CMAKE_CXX_STANDARD 17)

# Folly
include("${NODE_MODULES_DIR}/react-native/ReactAndroid/cmake-utils/folly-flags.cmake")
add_compile_options(${folly_FLAGS})

# Third party libraries (Prefabs)
find_package(ReactAndroid REQUIRED CONFIG)
find_package(fbjni REQUIRED CONFIG)
find_package(react-native-worklets REQUIRED CONFIG)
find_library(LOG_LIB log)


set(RNSKIA_PATH ${NODE_MODULES_DIR}/@shopify/react-native-skia)
if(EXISTS ${RNSKIA_PATH})
    find_package(shopify_react-native-skia REQUIRED CONFIG)
    set(SKIA_PACKAGE shopify_react-native-skia::rnskia)
    message("VisionCamera: Skia integration enabled!")
else()
    message("VisionCamera: Skia integration disabled!")
ENDIF()

# Add react-native-vision-camera sources
add_library(
        ${PACKAGE_NAME}
        SHARED
        ../cpp/JSITypedArray.cpp
        src/main/cpp/FrameHostObject.cpp
        src/main/cpp/FrameProcessorPluginHostObject.cpp
        src/main/cpp/JSIJNIConversion.cpp
        src/main/cpp/VisionCamera.cpp
        src/main/cpp/VisionCameraProxy.cpp
        src/main/cpp/java-bindings/JFrame.cpp
        src/main/cpp/java-bindings/JFrameProcessor.cpp
        src/main/cpp/java-bindings/JFrameProcessorPlugin.cpp
        src/main/cpp/java-bindings/JHashMap.cpp
        src/main/cpp/java-bindings/JVisionCameraProxy.cpp
        src/main/cpp/java-bindings/JVisionCameraScheduler.cpp
)

# Header Search Paths (includes)
target_include_directories(
        ${PACKAGE_NAME}
        PRIVATE
        "../cpp"
        "src/main/cpp"
        "${NODE_MODULES_DIR}/react-native/ReactCommon"
        "${NODE_MODULES_DIR}/react-native/ReactCommon/callinvoker"
        "${NODE_MODULES_DIR}/react-native/ReactAndroid/src/main/jni/react/turbomodule" # <-- CallInvokerHolder JNI wrapper

        # We need to include the headers from skia
        # (Note: rnskia includes all their files without any relative path
        #  so for example "include/core/SkImage.h" becomes #include "SkImage.h".
        #  That's why for the prefab of rnskia, we flatten all cpp files into
        #  just one directory. HOWEVER, skia itself uses relative paths in
        #  their include statements, and so we have to include the path to skia)
        "${RNSKIA_PATH}/cpp/skia"
)

# Link everything together
target_link_libraries(
        ${PACKAGE_NAME}
        ${LOG_LIB}                          # <-- Logcat logger
        android                             # <-- Android JNI core
        ReactAndroid::jsi                   # <-- RN: JSI
        ReactAndroid::reactnativejni        # <-- RN: React Native JNI bindings
        ReactAndroid::folly_runtime         # <-- RN: For casting JSI <> Java objects
        fbjni::fbjni                        # <-- fbjni
        react-native-worklets::rnworklets   # <-- RN Worklets
        ${SKIA_PACKAGE}                     # <-- Optional: RN Skia
)
