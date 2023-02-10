project(VisionCamera)
cmake_minimum_required(VERSION 3.9.0)

set(CMAKE_VERBOSE_MAKEFILE ON)
set(PACKAGE_NAME "VisionCamera")
set(BUILD_DIR ${CMAKE_SOURCE_DIR}/build)
set(CMAKE_VERBOSE_MAKEFILE ON)
set(CMAKE_CXX_STANDARD 17)

# Add react-native-vision-camera sources
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
        "src/main/cpp"
        "${NODE_MODULES_DIR}/react-native/ReactCommon"
        "${NODE_MODULES_DIR}/react-native/ReactCommon/callinvoker"
        "${NODE_MODULES_DIR}/react-native/ReactAndroid/src/main/jni/react/turbomodule" # <-- CallInvokerHolder JNI wrapper
        "${NODE_MODULES_DIR}/react-native-worklets/cpp"
)

find_package(ReactAndroid REQUIRED CONFIG)
find_package(fbjni REQUIRED CONFIG)
#find_package(react-native-worklets REQUIRED CONFIG)
find_library(log-lib log)

target_link_libraries(
        ${PACKAGE_NAME}
        worklets                            # <-- RN Worklets
        ${log-lib}                          # <-- Logcat logger
        ReactAndroid::jsi                   # <-- JSI
        ReactAndroid::reactnativejni        # <-- React Native JNI bindings
        ReactAndroid::folly_runtime         # <-- For casting JSI <> Java objects
        fbjni::fbjni                        # <-- fbjni
#        react-native-worklets::rnworklets   # <-- RN Worklets
        android                             # <-- Android JNI core
)
