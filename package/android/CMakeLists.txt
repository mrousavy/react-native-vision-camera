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

if (ENABLE_SKIA)
    add_definitions(-DVISION_CAMERA_ENABLE_SKIA=true)
    add_definitions(-DSK_GL)
    add_definitions(-DSK_GANESH)
    add_definitions(-DSK_BUILD_FOR_ANDROID)
else()
    add_definitions(-DVISION_CAMERA_ENABLE_SKIA=false)
endif()


# Add react-native-vision-camera sources
add_library(
        ${PACKAGE_NAME}
        SHARED
        # Shared C++
        ../cpp/MutableRawBuffer.cpp
        # Java JNI
        src/main/cpp/VisionCamera.cpp
        src/main/cpp/MutableJByteBuffer.cpp
        # Frame Processor
        src/main/cpp/frameprocessor/FrameHostObject.cpp
        src/main/cpp/frameprocessor/FrameProcessorPluginHostObject.cpp
        src/main/cpp/frameprocessor/JSIJNIConversion.cpp
        src/main/cpp/frameprocessor/VisionCameraProxy.cpp
        src/main/cpp/frameprocessor/java-bindings/JSharedArray.cpp
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
)

# Optionally also add Frame Processors here
message("VisionCamera: Frame Processors: ${ENABLE_FRAME_PROCESSORS}")
if (ENABLE_FRAME_PROCESSORS)
    message("VisionCamera: Linking react-native-worklets...")
    find_package(react-native-worklets-core REQUIRED CONFIG)
    target_link_libraries(
            ${PACKAGE_NAME}
            react-native-worklets-core::rnworklets
    )

    message("VisionCamera: Skia: ${ENABLE_SKIA}")
    if (ENABLE_SKIA)
        # 1. Link react-native-skia
        message("VisionCamera: Linking react-native-skia...")
        find_package(shopify_react-native-skia REQUIRED CONFIG)
        target_link_libraries(
                ${PACKAGE_NAME}
                shopify_react-native-skia::rnskia
        )

        # 2. Add react-native-skia to path so it itself can find it's relative imports
        get_target_property(RN_SKIA_INCLUDE_DIR shopify_react-native-skia::rnskia INTERFACE_INCLUDE_DIRECTORIES)
        message("VisionCamera: react-native-skia include directory: ${RN_SKIA_INCLUDE_DIR}")
        include_directories("${RN_SKIA_INCLUDE_DIR}/react-native-skia")

        # 3. Link skia itself
        set(RN_SKIA_DIR "${NODE_MODULES_DIR}/@shopify/react-native-skia")
        message("VisionCamera: react-native-skia directory: ${RN_SKIA_DIR}")
        file(GLOB skiaLibraries "${RN_SKIA_DIR}/libs/android/${ANDROID_ABI}/*.a")
        foreach(skiaLibrary ${skiaLibraries})
            message("VisionCamera: Linking ${skiaLibrary}...")
            target_link_libraries(${PACKAGE_NAME} "${skiaLibrary}")
        endforeach()
    endif()
endif()
