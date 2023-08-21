project(VisionCamera)
cmake_minimum_required(VERSION 3.9.0)

set(CMAKE_VERBOSE_MAKEFILE ON)
set(PACKAGE_NAME "VisionCamera")
set(BUILD_DIR ${CMAKE_SOURCE_DIR}/build)
set(CMAKE_VERBOSE_MAKEFILE ON)
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -DSK_GL -DSK_GANESH -DSK_BUILD_FOR_ANDROID")

# Folly
include("${NODE_MODULES_DIR}/react-native/ReactAndroid/cmake-utils/folly-flags.cmake")
add_compile_options(${folly_FLAGS})

# Third party libraries (Prefabs)
find_package(ReactAndroid REQUIRED CONFIG)
find_package(fbjni REQUIRED CONFIG)
find_package(react-native-worklets-core REQUIRED CONFIG)
find_library(LOG_LIB log)

set(RNSKIA_PATH ${NODE_MODULES_DIR}/@shopify/react-native-skia)
if(EXISTS ${RNSKIA_PATH})
    find_package(shopify_react-native-skia REQUIRED CONFIG)
    set(SKIA_PACKAGE shopify_react-native-skia::rnskia)
    message("VisionCamera: Skia integration enabled!")
else()
    message("VisionCamera: Skia integration disabled!")
ENDIF()

set (SKIA_LIBS_PATH "${RNSKIA_PATH}/libs/android/${ANDROID_ABI}")
add_library(skia STATIC IMPORTED)
set_property(TARGET skia PROPERTY IMPORTED_LOCATION "${SKIA_LIBS_PATH}/libskia.a")
add_library(svg STATIC IMPORTED)
set_property(TARGET svg PROPERTY IMPORTED_LOCATION "${SKIA_LIBS_PATH}/libsvg.a")
add_library(skshaper STATIC IMPORTED)
set_property(TARGET skshaper PROPERTY IMPORTED_LOCATION "${SKIA_LIBS_PATH}/libskshaper.a")

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
        src/main/cpp/skia/SkiaRenderer.cpp
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

        "${RNSKIA_PATH}/cpp/skia/include/config/"
        "${RNSKIA_PATH}/cpp/skia/include/core/"
        "${RNSKIA_PATH}/cpp/skia/include/effects/"
        "${RNSKIA_PATH}/cpp/skia/include/utils/"
        "${RNSKIA_PATH}/cpp/skia/include/pathops/"
        "${RNSKIA_PATH}/cpp/skia/modules/"
        # "${RNSKIA_PATH}/cpp/skia/modules/skparagraph/include/"
        "${RNSKIA_PATH}/cpp/skia/include/"
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
        react-native-worklets-core::rnworklets   # <-- RN Worklets
        GLESv2                              # <-- Optional: OpenGL (for Skia)
        EGL                                 # <-- Optional: OpenGL (EGL) (for Skia)
        ${SKIA_PACKAGE}                     # <-- Optional: RN Skia
        jnigraphics
        skia
        svg
        skshaper
)
