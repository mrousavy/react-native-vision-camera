cmake_minimum_required(VERSION 3.4.1)

set (CMAKE_VERBOSE_MAKEFILE ON)
set (CMAKE_CXX_STANDARD 14)
set (CMAKE_CXX_FLAGS "-DFOLLY_NO_CONFIG=1 -DFOLLY_HAVE_CLOCK_GETTIME=1 -DFOLLY_HAVE_MEMRCHR=1 -DFOLLY_USE_LIBCPP=1 -DFOLLY_MOBILE=1 -DON_ANDROID -DONANDROID -DFOR_HERMES=${FOR_HERMES}")

set (PACKAGE_NAME "VisionCamera")
set (BUILD_DIR ${CMAKE_SOURCE_DIR}/build)
set (RN_SO_DIR ${NODE_MODULES_DIR}/react-native/ReactAndroid/src/main/jni/first-party/react/jni)

# VisionCamera shared

add_library(
        ${PACKAGE_NAME}
        SHARED
        src/main/cpp/VisionCamera.cpp
        src/main/cpp/JSIJNIConversion.cpp
        src/main/cpp/FrameProcessorRuntimeManager.cpp
        src/main/cpp/FrameProcessorPlugin.cpp
        src/main/cpp/CameraView.cpp
        src/main/cpp/JImageProxy.cpp
        src/main/cpp/JImageProxyHostObject.cpp
        src/main/cpp/JHashMap.cpp
)

# includes

file (GLOB LIBFBJNI_INCLUDE_DIR "${BUILD_DIR}/fbjni-*-headers.jar/")

target_include_directories(
        ${PACKAGE_NAME}
        PRIVATE
        "${LIBFBJNI_INCLUDE_DIR}"
        "${BUILD_DIR}/third-party-ndk/boost"
        "${BUILD_DIR}/third-party-ndk/double-conversion"
        "${BUILD_DIR}/third-party-ndk/folly"
        "${BUILD_DIR}/third-party-ndk/glog"
        "${NODE_MODULES_DIR}/react-native/React"
        "${NODE_MODULES_DIR}/react-native/React/Base"
        "${NODE_MODULES_DIR}/react-native/ReactAndroid/src/main/jni"
        "${NODE_MODULES_DIR}/react-native/ReactAndroid/src/main/java/com/facebook/react/turbomodule/core/jni"
        "${NODE_MODULES_DIR}/react-native/ReactCommon"
        "${NODE_MODULES_DIR}/react-native/ReactCommon/callinvoker"
        "${NODE_MODULES_DIR}/react-native/ReactCommon/jsi"
        "${NODE_MODULES_DIR}/hermes-engine/android/include/"
        "${NODE_MODULES_DIR}/react-native-reanimated/Common/cpp/headers/Tools"
        "${NODE_MODULES_DIR}/react-native-reanimated/Common/cpp/headers/SpecTools"
        "${NODE_MODULES_DIR}/react-native-reanimated/Common/cpp/headers/SharedItems"
        "${NODE_MODULES_DIR}/react-native-reanimated/Common/cpp/headers/Registries"
        "${NODE_MODULES_DIR}/react-native-reanimated/Common/cpp/hidden_headers"
        "src/main/cpp"
        "../cpp"
)

# find libraries

file (GLOB LIBRN_DIR "${BUILD_DIR}/react-native-0*/jni/${ANDROID_ABI}")
file (GLOB LIBJSC_DIR "${BUILD_DIR}/android-jsc*.aar/jni/${ANDROID_ABI}")
file (GLOB LIBHERMES_DIR "${BUILD_DIR}/third-party-ndk/hermes/jni/${ANDROID_ABI}")

if(${FOR_HERMES})
    file (GLOB LIBREANIMATED_DIR "${BUILD_DIR}/react-native-reanimated-*-hermes.aar/jni/${ANDROID_ABI}")
else()
    file (GLOB LIBREANIMATED_DIR "${BUILD_DIR}/react-native-reanimated-*-jsc.aar/jni/${ANDROID_ABI}")
endif()


find_library(
        LOG_LIB
        log
)
find_library(
        FBJNI_LIB
        fbjni
        PATHS ${LIBRN_DIR}
        NO_CMAKE_FIND_ROOT_PATH
)
find_library(
        REANIMATED_LIB
        reanimated
        PATHS ${LIBREANIMATED_DIR}
        NO_CMAKE_FIND_ROOT_PATH
)

find_library(
        FOLLY_JSON_LIB
        folly_json
        PATHS ${LIBRN_DIR}
        NO_CMAKE_FIND_ROOT_PATH
)

find_library(
        REACT_NATIVE_JNI_LIB
        reactnativejni
        PATHS ${LIBRN_DIR}
        NO_CMAKE_FIND_ROOT_PATH
)

find_library(
        REACT_NATIVE_UTILS_LIB
        reactnativeutilsjni
        PATHS ${LIBRN_DIR}
        NO_CMAKE_FIND_ROOT_PATH
)

find_library(
        HERMES_LIB
        hermes
        PATHS ${LIBHERMES_DIR}
        NO_CMAKE_FIND_ROOT_PATH
)
find_library(
        JSEXECUTOR_LIB
        jscexecutor
        PATHS ${LIBRN_DIR}
        NO_CMAKE_FIND_ROOT_PATH
)

# linking

message(WARNING "VisionCamera linking: FOR_HERMES=${FOR_HERMES}")

if(${FOR_HERMES})
    target_link_libraries(
            ${PACKAGE_NAME}
            ${LOG_LIB}
            ${HERMES_LIB}
            ${REANIMATED_LIB}
            ${REACT_NATIVE_JNI_LIB}
            ${REACT_NATIVE_UTILS_LIB}
            ${FBJNI_LIB}
            ${FOLLY_JSON_LIB}
            android
    )
else()
    target_link_libraries(
            ${PACKAGE_NAME}
            ${LOG_LIB}
            ${JSEXECUTOR_LIB}
            ${REANIMATED_LIB}
            ${REACT_NATIVE_JNI_LIB}
            ${REACT_NATIVE_UTILS_LIB}
            ${FBJNI_LIB}
            ${FOLLY_JSON_LIB}
            android
    )
endif()