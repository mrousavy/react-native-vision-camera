require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

nodeModules = Dir.exist?(File.join(__dir__, "node_modules")) ? File.join(__dir__, "node_modules") : File.join(__dir__, "..")
workletsPath = File.join(nodeModules, "react-native-worklets")
hasWorklets = File.exist?(workletsPath)
puts "[VisionCamera] react-native-worklets #{hasWorklets ? "found" : "not found"}, Frame Processors #{hasWorklets ? "enabled" : "disabled"}!"

skiaPath = File.join(nodeModules, "@shopify", "react-native-skia")
hasSkia = hasWorklets && File.exist?(skiaPath)
puts "[VisionCamera] react-native-skia #{hasSkia ? "found" : "not found"}, Skia Frame Processors #{hasSkia ? "enabled" : "disabled"}!"

Pod::Spec.new do |s|
  s.name         = "VisionCamera"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.description  = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => "12.4" }
  s.source       = { :git => "https://github.com/mrousavy/react-native-vision-camera.git", :tag => "#{s.version}" }

  s.pod_target_xcconfig = {
    "GCC_PREPROCESSOR_DEFINITIONS" => "$(inherited) SK_METAL=1 SK_GANESH=1 VISION_ENABLE_FRAME_PROCESSORS=#{hasWorklets} VISION_CAMERA_ENABLE_SKIA=#{hasSkia}",
    "OTHER_SWIFT_FLAGS" => "$(inherited) #{hasWorklets ? "-D VISION_CAMERA_ENABLE_FRAME_PROCESSORS" : ""} #{hasSkia ? "-D VISION_CAMERA_ENABLE_SKIA" : ""}",
    "CLANG_CXX_LANGUAGE_STANDARD" => "c++17",
    "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/cpp/\"/** \"#{skiaPath}/cpp/skia/**\" "
  }

  s.requires_arc = true

  # All source files that should be publicly visible
  # Note how this does not include headers, since those can nameclash.
  s.source_files = [
    # Core
    "ios/*.{m,mm,swift}",
    "ios/Extensions/*.{m,mm,swift}",
    "ios/Parsers/*.{m,mm,swift}",
    "ios/React Utils/*.{m,mm,swift}",

    # Headers
    "ios/CameraBridge.h",
  ]
  # Any private headers that are not globally unique should be mentioned here.
  # Otherwise there will be a nameclash, since CocoaPods flattens out any header directories
  # See https://github.com/firebase/firebase-ios-sdk/issues/4035 for more details.
  s.preserve_paths = [
    "cpp/**/*.h",
    "ios/**/*.h"
  ]

  s.subspec "FrameProcessors" do |spec|
    spec.source_files = [
      "ios/Frame Processor/*.{m,mm,swift}",
      "cpp/**/*.{cpp}",
    ]
    spec.public_header_files = [
      "ios/Frame Processor/Frame.h",
      "ios/Frame Processor/FrameProcessorCallback.h",
      "ios/Frame Processor/FrameProcessorRuntimeManager.h",
      "ios/Frame Processor/FrameProcessorPluginRegistry.h",
      "ios/Frame Processor/FrameProcessorPlugin.h",
      "ios/React Utils/RCTBridge+runOnJS.h",
      "ios/React Utils/JSConsoleHelper.h",
    ]
    spec.header_dir = "ios/Frame Processor"
  end
  s.subspec "SkiaFrameProcessors" do |spec|
    spec.source_files = [
      "ios/Skia Render Layer/*.{m,mm,swift}",
      "cpp/**/*.{cpp}",
    ]
    spec.public_header_files = [
      "ios/Frame Processor/Frame.h",
      "ios/Frame Processor/FrameProcessorCallback.h",
      "ios/Frame Processor/FrameProcessorRuntimeManager.h",
      "ios/Frame Processor/FrameProcessorPluginRegistry.h",
      "ios/Frame Processor/FrameProcessorPlugin.h",
      "ios/React Utils/RCTBridge+runOnJS.h",
      "ios/React Utils/JSConsoleHelper.h",
    ]
    spec.header_dir = "Skia Render Layer"
  end

  s.dependency "React"
  s.dependency "React-callinvoker"
  s.dependency "React-Core"

  s.default_subspecs = []
  if hasWorklets
    s.dependency "react-native-worklets"
    s.default_subspecs = ["FrameProcessors"]
    if hasSkia
      s.dependency "react-native-skia"
      s.default_subspecs = ["FrameProcessors", "SkiaFrameProcessors"]
    end
  end
end
