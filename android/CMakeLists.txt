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
find_library(LOG_LIB log)

add_definitions(-DVISION_CAMERA_ENABLE_FRAME_PROCESSORS=${ENABLE_FRAME_PROCESSORS} -DVISION_CAMERA_ENABLE_SKIA=${ENABLE_SKIA})


# Add react-native-vision-camera sources
add_library(
        ${PACKAGE_NAME}
        SHARED
        ../cpp/JSITypedArray.cpp
        src/main/cpp/VisionCamera.cpp
        # Frame Processor
        src/main/cpp/frameprocessor/FrameHostObject.cpp
        src/main/cpp/frameprocessor/FrameProcessorPluginHostObject.cpp
        src/main/cpp/frameprocessor/JSIJNIConversion.cpp
        src/main/cpp/frameprocessor/VisionCameraProxy.cpp
        src/main/cpp/frameprocessor/java-bindings/JFrame.cpp
        src/main/cpp/frameprocessor/java-bindings/JFrameProcessor.cpp
        src/main/cpp/frameprocessor/java-bindings/JFrameProcessorPlugin.cpp
        src/main/cpp/frameprocessor/java-bindings/JVisionCameraProxy.cpp
        src/main/cpp/frameprocessor/java-bindings/JVisionCameraScheduler.cpp
        # Skia Frame Processor
        src/main/cpp/skia/SkiaRenderer.cpp
)

# Header Search Paths (includes)
target_include_directories(
        ${PACKAGE_NAME}
        PRIVATE
        "../cpp"
        "src/main/cpp"
        "src/main/cpp/frameprocessor"
        "src/main/cpp/frameprocessor/java-bindings"
        "src/main/cpp/skia"
        "${NODE_MODULES_DIR}/react-native/ReactCommon"
        "${NODE_MODULES_DIR}/react-native/ReactCommon/callinvoker"
        "${NODE_MODULES_DIR}/react-native/ReactAndroid/src/main/jni/react/turbomodule" # <-- CallInvokerHolder JNI wrapper
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
)

# Optionally also add Frame Processors here
if(ENABLE_FRAME_PROCESSORS)
    find_package(react-native-worklets-core REQUIRED CONFIG)
    target_link_libraries(
            ${PACKAGE_NAME}
            react-native-worklets-core::rnworklets
    )
    message("VisionCamera: Frame Processors enabled!")

    # Optionally also add Skia Integration here
    if(ENABLE_SKIA)
        set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -DSK_GL -DSK_GANESH -DSK_BUILD_FOR_ANDROID")

        find_package(shopify_react-native-skia REQUIRED CONFIG)

        set(SKIA_PACKAGE shopify_react-native-skia::rnskia)
        set(RNSKIA_PATH ${NODE_MODULES_DIR}/@shopify/react-native-skia)
        set (SKIA_LIBS_PATH "${RNSKIA_PATH}/libs/android/${ANDROID_ABI}")
        add_library(skia STATIC IMPORTED)
        set_property(TARGET skia PROPERTY IMPORTED_LOCATION "${SKIA_LIBS_PATH}/libskia.a")
        add_library(svg STATIC IMPORTED)
        set_property(TARGET svg PROPERTY IMPORTED_LOCATION "${SKIA_LIBS_PATH}/libsvg.a")
        add_library(skshaper STATIC IMPORTED)
        set_property(TARGET skshaper PROPERTY IMPORTED_LOCATION "${SKIA_LIBS_PATH}/libskshaper.a")

        # We need to include the headers from skia
        # (Note: rnskia includes all their files without any relative path
        #  so for example "include/core/SkImage.h" becomes #include "SkImage.h".
        #  That's why for the prefab of rnskia, we flatten all cpp files into
        #  just one directory. HOWEVER, skia itself uses relative paths in
        #  their include statements, and so we have to include the path to skia)
        target_include_directories(
                ${PACKAGE_NAME}
                PRIVATE
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

        target_link_libraries(
                ${PACKAGE_NAME}
                GLESv2                              # <-- Optional: OpenGL (for Skia)
                EGL                                 # <-- Optional: OpenGL (EGL) (for Skia)
                ${SKIA_PACKAGE}                     # <-- Optional: RN Skia
                jnigraphics
                skia
                svg
                skshaper
        )

        message("VisionCamera: Skia enabled!")
    endif()
endif()
