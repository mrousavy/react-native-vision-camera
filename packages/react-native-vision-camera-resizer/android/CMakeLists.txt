project(VisionCameraResizer)
cmake_minimum_required(VERSION 3.9.0)

set (PACKAGE_NAME VisionCameraResizer)
set (CMAKE_VERBOSE_MAKEFILE ON)
set (CMAKE_CXX_STANDARD 20)

# Define C++ library and add all sources
add_library(${PACKAGE_NAME} SHARED
        src/main/cpp/cpp-adapter.cpp
        src/main/cpp/HybridGPUFrame.cpp
        src/main/cpp/HybridResizer.cpp
        src/main/cpp/HybridResizerFactory.cpp
        src/main/cpp/utils/AndroidAssetManager.cpp
        src/main/cpp/utils/OutputBufferLayout.cpp
        src/main/cpp/vulkan/VulkanDynamicDispatch.cpp
        src/main/cpp/vulkan/VulkanBufferView.cpp
        src/main/cpp/vulkan/VulkanUtils.cpp
        src/main/cpp/vulkan/VulkanPhysicalDeviceSelector.cpp
        src/main/cpp/vulkan/VulkanHardwareBufferInterop.cpp
        src/main/cpp/vulkan/VulkanReusableBuffer.cpp
        src/main/cpp/vulkan/VulkanResizerShaderConfig.cpp
        src/main/cpp/vulkan/VulkanShaderAssetLoader.cpp
        src/main/cpp/vulkan/VulkanResizerPipeline.cpp
)

# Keep enum-driven output layout switches exhaustive as formats evolve.
if (CMAKE_CXX_COMPILER_ID MATCHES "Clang|GNU")
    target_compile_options(${PACKAGE_NAME} PRIVATE -Wswitch-enum -Werror=switch-enum)
endif()

# Add Nitrogen specs :)
include(${CMAKE_CURRENT_SOURCE_DIR}/../nitrogen/generated/android/VisionCameraResizer+autolinking.cmake)

# Set up local includes
target_include_directories(${PACKAGE_NAME} PRIVATE
        "${CMAKE_CURRENT_SOURCE_DIR}/src/main/cpp"
        "${CMAKE_CURRENT_SOURCE_DIR}/../cpp"
)

find_library(LOG_LIB log)
find_library(VULKAN_LIB vulkan)
find_package(react-native-vision-camera REQUIRED)   # <-- for the HybridFrameSpec

# Link all libraries together
target_link_libraries(
        ${PACKAGE_NAME}
        ${LOG_LIB}
        ${VULKAN_LIB}
        android                                   # <-- Android core
        react-native-vision-camera::VisionCamera
)
