project(VisionCamera)
cmake_minimum_required(VERSION 3.9.0)

set(CMAKE_VERBOSE_MAKEFILE ON)
set(PACKAGE_NAME "VisionCamera")
set(BUILD_DIR ${CMAKE_SOURCE_DIR}/build)
set(CMAKE_VERBOSE_MAKEFILE ON)
set(CMAKE_CXX_STANDARD 17)

# Third party libraries (Prefabs)
find_package(ReactAndroid REQUIRED CONFIG)
find_package(fbjni REQUIRED CONFIG)
find_library(LOG_LIB log)

add_definitions(-DVISION_CAMERA_ENABLE_FRAME_PROCESSORS=${ENABLE_FRAME_PROCESSORS})


# Add react-native-vision-camera sources
add_library(
        ${PACKAGE_NAME}
        SHARED
        ../cpp/JSITypedArray.cpp
        src/main/cpp/VisionCamera.cpp
        src/main/cpp/VideoPipeline.cpp
        src/main/cpp/PassThroughShader.cpp
        src/main/cpp/OpenGLContext.cpp
        src/main/cpp/OpenGLRenderer.cpp
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
)

# Header Search Paths (includes)
target_include_directories(
        ${PACKAGE_NAME}
        PRIVATE
        "../cpp"
        "src/main/cpp"
        "src/main/cpp/frameprocessor"
        "src/main/cpp/frameprocessor/java-bindings"
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
        fbjni::fbjni                        # <-- fbjni
        GLESv2                              # <-- OpenGL (for VideoPipeline)
        EGL                                 # <-- OpenGL (EGL) (for VideoPipeline)
)

# Optionally also add Frame Processors here
if(ENABLE_FRAME_PROCESSORS)
    find_package(react-native-worklets-core REQUIRED CONFIG)
    target_link_libraries(
            ${PACKAGE_NAME}
            react-native-worklets-core::rnworklets
    )
    message("VisionCamera: Frame Processors enabled!")
endif()
