require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

nodeModules = Dir.exist?(File.join(__dir__, "node_modules")) ? File.join(__dir__, "node_modules") : File.join(__dir__, "..")
workletsPath = File.join(nodeModules, "react-native-worklets")
hasWorklets = File.exist?(workletsPath)
puts "[VisionCamera] react-native-worklets #{hasWorklets ? "found" : "not found"}, Frame Processors #{hasWorklets ? "enabled" : "disabled"}!"

skiaPath = File.join(nodeModules, "@shopify", "react-native-skia")
hasSkia = File.exist?(skiaPath)
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
    "ios/CameraBridge.h",

    # Frame Processors
    hasWorklets ? "ios/Frame Processor/*.{m,mm,swift}" : "",
    hasWorklets ? "ios/Frame Processor/Frame.h" : "",
    hasWorklets ? "ios/Frame Processor/FrameProcessorCallback.h" : "",
    hasWorklets ? "ios/Frame Processor/FrameProcessorRuntimeManager.h" : "",
    hasWorklets ? "ios/Frame Processor/FrameProcessorPlugin.h" : "",
    hasWorklets ? "ios/React Utils/JSConsoleHelper.h" : "",
    hasWorklets ? "cpp/**/*.{cpp}" : "",

    # Skia Frame Processors
    hasSkia ? "ios/Skia Render Layer/*.{m,mm,swift}" : "",
    hasSkia ? "ios/Skia Render Layer/SkiaPreviewView.h" : "",
  ]
  # Any private headers that are not globally unique should be mentioned here.
  # Otherwise there will be a nameclash, since CocoaPods flattens out any header directories
  # See https://github.com/firebase/firebase-ios-sdk/issues/4035 for more details.
  s.preserve_paths = [
    "cpp/**/*.h",
    "ios/**/*.h"
  ]

  s.dependency "React"
  s.dependency "React-Core"
  s.dependency "React-callinvoker"

  if hasWorklets
    s.dependency "react-native-worklets"
    if hasSkia
      s.dependency "react-native-skia"
    end
  end
end
