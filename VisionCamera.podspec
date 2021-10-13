require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

reactVersion = '0.0.0'
begin
  reactVersion = JSON.parse(File.read(File.join(__dir__, "..", "react-native", "package.json")))["version"]
rescue
  reactVersion = '0.66.0'
end
rnVersion = reactVersion.split('.')[1]

folly_flags = '-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1 -DRNVERSION=' + rnVersion
folly_compiler_flags = folly_flags + ' ' + '-Wno-comma -Wno-shorten-64-to-32'
folly_version = '2021.04.26.00'
boost_compiler_flags = '-Wno-documentation'

Pod::Spec.new do |s|
  s.name         = "VisionCamera"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => "11.0" }
  s.source       = { :git => "https://github.com/mrousavy/react-native-vision-camera.git", :tag => "#{s.version}" }

  s.pod_target_xcconfig = {
    "USE_HEADERMAP" => "YES",
    "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_TARGET_SRCROOT)\" \"$(PODS_ROOT)/RCT-Folly\" \"$(PODS_ROOT)/boost\" \"$(PODS_ROOT)/boost-for-react-native\" \"$(PODS_ROOT)/DoubleConversion\" \"$(PODS_ROOT)/Headers/Private/React-Core\" "
  }
  s.compiler_flags = folly_compiler_flags + ' ' + boost_compiler_flags
  s.xcconfig = {
    "CLANG_CXX_LANGUAGE_STANDARD" => "c++14",
    "HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)/boost\" \"$(PODS_ROOT)/boost-for-react-native\" \"$(PODS_ROOT)/glog\" \"$(PODS_ROOT)/RCT-Folly\" \"${PODS_ROOT}/Headers/Public/React-hermes\" \"${PODS_ROOT}/Headers/Public/hermes-engine\"",
    "OTHER_CFLAGS" => "$(inherited)" + " " + folly_flags
  }

  s.requires_arc = true

  # All source files that should be publicly visible
  # Note how this does not include headers, since those can nameclash.
  s.source_files = [
    "ios/**/*.{m,mm,swift}",
    "ios/CameraBridge.h",
    "ios/Frame Processor/Frame.h",
    "ios/Frame Processor/FrameProcessorCallback.h",
    "ios/Frame Processor/FrameProcessorRuntimeManager.h",
    "ios/Frame Processor/FrameProcessorPluginRegistry.h",
    "ios/Frame Processor/FrameProcessorPlugin.h",
    "ios/React Utils/RCTBridge+runOnJS.h",
    "ios/React Utils/JSConsoleHelper.h",
    "cpp/**/*.{cpp}",
  ]
  # Any private headers that are not globally unique should be mentioned here.
  # Otherwise there will be a nameclash, since CocoaPods flattens out any header directories
  # See https://github.com/firebase/firebase-ios-sdk/issues/4035 for more details.
  s.preserve_paths = [
    "cpp/**/*.h",
    "ios/**/*.h"
  ]

  s.dependency "React-callinvoker"
  s.dependency "React"
  s.dependency "React-Core"
end
