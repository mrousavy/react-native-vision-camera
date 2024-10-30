project(VisionCamera)
cmake_minimum_required(VERSION 3.9.0)

set(PACKAGE_NAME "VisionCamera")
set(BUILD_DIR ${CMAKE_SOURCE_DIR}/build)
set(CMAKE_VERBOSE_MAKEFILE ON)
set(CMAKE_CXX_STANDARD 17)

# Third party libraries (Prefabs)
find_package(ReactAndroid REQUIRED CONFIG)
find_package(fbjni REQUIRED CONFIG)
find_library(LOG_LIB log)

# Enables OpenGL/EGL HardwareBuffer and EGLImageKHR APIs
add_definitions(-DEGL_EGLEXT_PROTOTYPES)
add_definitions(-DGL_GLEXT_PROTOTYPES)

if (ENABLE_FRAME_PROCESSORS)
        add_definitions(-DVISION_CAMERA_ENABLE_FRAME_PROCESSORS=true)
else()
        add_definitions(-DVISION_CAMERA_ENABLE_FRAME_PROCESSORS=false)
endif()


# Add react-native-vision-camera sources
add_library(
        ${PACKAGE_NAME}
        SHARED
        # Java JNI
        src/main/cpp/VisionCamera.cpp
        src/main/cpp/MutableJByteBuffer.cpp
        # Frame Processor
        src/main/cpp/frameprocessors/FrameHostObject.cpp
        src/main/cpp/frameprocessors/FrameProcessorPluginHostObject.cpp
        src/main/cpp/frameprocessors/JSIJNIConversion.cpp
        src/main/cpp/frameprocessors/VisionCameraProxy.cpp
        src/main/cpp/frameprocessors/java-bindings/JSharedArray.cpp
        src/main/cpp/frameprocessors/java-bindings/JFrame.cpp
        src/main/cpp/frameprocessors/java-bindings/JFrameProcessor.cpp
        src/main/cpp/frameprocessors/java-bindings/JFrameProcessorPlugin.cpp
        src/main/cpp/frameprocessors/java-bindings/JVisionCameraProxy.cpp
        src/main/cpp/frameprocessors/java-bindings/JVisionCameraScheduler.cpp
)

# Header Search Paths (includes)
target_include_directories(
        ${PACKAGE_NAME}
        PRIVATE
        "src/main/cpp"
        "src/main/cpp/frameprocessors"
        "src/main/cpp/frameprocessors/java-bindings"
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
        fbjni::fbjni                        # <-- fbjni
)

# Link react-native (different prefab between RN 0.75 and RN 0.76)
if(ReactAndroid_VERSION_MINOR GREATER_EQUAL 76)
    target_link_libraries(
        ${PACKAGE_NAME}
        ReactAndroid::reactnative                 # <-- RN: Native Modules umbrella prefab
    )
else()
    target_link_libraries(
        ${PACKAGE_NAME}
        ReactAndroid::reactnativejni              # <-- RN: JNI Utils (e.g. CallInvoker)
    )
endif()

# Optionally also add Frame Processors here
message("VisionCamera: Frame Processors: ${ENABLE_FRAME_PROCESSORS}!")
if (ENABLE_FRAME_PROCESSORS)
    message("VisionCamera: Linking react-native-worklets...")
    find_package(react-native-worklets-core REQUIRED CONFIG)
    target_link_libraries(
            ${PACKAGE_NAME}
            react-native-worklets-core::rnworklets
    )
endif()
