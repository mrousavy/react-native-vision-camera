require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

nodeModules = File.join(File.dirname(`cd "#{Pod::Config.instance.installation_root.to_s}" && node --print "require.resolve('react-native/package.json')"`), '..')

enableFrameProcessors = true
if defined?($VCEnableFrameProcessors)
  Pod::UI.puts "[VisionCamera] $VCEnableFrameProcessors is set to #{$VCEnableFrameProcessors}!"
  enableFrameProcessors = $VCEnableFrameProcessors
end

enableLocation = true
if defined?($VCEnableLocation)
  Pod::UI.puts "[VisionCamera] $VCEnableLocation is set to #{$VCEnableLocation}!"
  enableLocation = $VCEnableLocation
else
  Pod::UI.puts "[VisionCamera] Building with CLLocation APIs as $VCEnableLocation is not set.."
end

Pod::UI.puts("[VisionCamera] node modules #{Dir.exist?(nodeModules) ? "found at #{nodeModules}" : "not found!"}")
workletsPath = File.join(nodeModules, "react-native-worklets-core")
hasWorklets = File.exist?(workletsPath) && enableFrameProcessors
Pod::UI.puts("[VisionCamera] react-native-worklets-core #{hasWorklets ? "found" : "not found"}, Frame Processors #{hasWorklets ? "enabled" : "disabled"}!")

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
    "GCC_PREPROCESSOR_DEFINITIONS" => "$(inherited) VISION_CAMERA_ENABLE_FRAME_PROCESSORS=#{hasWorklets}",
    "SWIFT_ACTIVE_COMPILATION_CONDITIONS" => "$(inherited) #{hasWorklets ? "VISION_CAMERA_ENABLE_FRAME_PROCESSORS" : ""} #{enableLocation ? "VISION_CAMERA_ENABLE_LOCATION" : ""}",
    "CLANG_CXX_LANGUAGE_STANDARD" => "c++17",
    "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/cpp/\"/** "
  }

  s.requires_arc = true

  # All source files that should be publicly visible
  # Note how this does not include headers, since those can nameclash.
  s.source_files = [
    # Core
    "ios/*.{m,mm,swift}",
    "ios/Core/*.{m,mm,swift}",
    "ios/Extensions/*.{m,mm,swift}",
    "ios/Parsers/*.{m,mm,swift}",
    "ios/React Utils/*.{m,mm,swift}",
    "ios/Types/*.{m,mm,swift}",
    "ios/CameraBridge.h",

    # Frame Processors
    hasWorklets ? "ios/Frame Processor/*.{m,mm,swift}" : "",
    hasWorklets ? "ios/Frame Processor/Frame.h" : "",
    hasWorklets ? "ios/Frame Processor/FrameProcessor.h" : "",
    hasWorklets ? "ios/Frame Processor/FrameProcessorPlugin.h" : "",
    hasWorklets ? "ios/Frame Processor/FrameProcessorPluginRegistry.h" : "",
    hasWorklets ? "ios/Frame Processor/SharedArray.h" : "",
    hasWorklets ? "ios/Frame Processor/VisionCameraProxy.h" : "",
    hasWorklets ? "cpp/**/*.{cpp}" : "",
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
    s.dependency "react-native-worklets-core"
  end
end
