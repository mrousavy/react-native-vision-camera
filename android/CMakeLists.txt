cmake_minimum_required(VERSION 3.9.0)

include_directories(
        ../../react-native/React
        ../../react-native/React/Base
        ../../react-native/ReactCommon/jsi
)

file(GLOB android_cpp_src
        "src/main/cpp/*.h"
        "src/main/cpp/*.cpp"
        "../cpp/*.h"
        "../cpp/*.cpp"
)

add_library(cpp  # <-- Library name
        SHARED
        # Provides a relative path to your source file(s).
        ../../react-native/ReactCommon/jsi/jsi/jsi.cpp
        ${android_cpp_src}
)

#set_target_properties(
#        cpp PROPERTIES
#        CXX_STANDARD 17
#        CXX_EXTENSIONS OFF
#        POSITION_INDEPENDENT_CODE ON
#)

target_link_libraries(
        cpp
        android
)
