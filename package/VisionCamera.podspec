require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::UI.puts "[VisionCamera] Thank you for using VisionCamera ❤️"
Pod::UI.puts "[VisionCamera] If you enjoy using VisionCamera, please consider sponsoring this project: https://github.com/sponsors/mrousavy"

enableLocation = true
if defined?($VCEnableLocation)
  Pod::UI.puts "[VisionCamera] $VCEnableLocation is set to #{$VCEnableLocation}!"
  enableLocation = $VCEnableLocation
else
  Pod::UI.puts "[VisionCamera] $VCEnableLocation is not set, enabling CLLocation APIs by default..."
end

enableFrameProcessors = true
if defined?($VCEnableFrameProcessors)
 Pod::UI.puts "[VisionCamera] $VCEnableFrameProcessors is set to #{$VCEnableFrameProcessors}!"
 enableFrameProcessors = $VCEnableFrameProcessors
else
 Pod::UI.puts "[VisionCamera] $VCEnableFrameProcessors is not set, enabling Frame Processors if Worklets is installed..."
end

def Pod::getWorkletsLibraryPath
  output = `cd "#{Pod::Config.instance.installation_root.to_s}" && node --print "try { require.resolve('react-native-worklets-core/package.json') } catch(e) { /* returning undefined, if package not found */ }"`
  
  if output.strip == "undefined"
    return nil
  else
    return File.dirname(output)
  end
end

workletsPath = getWorkletsLibraryPath()
hasWorklets = workletsPath != nil && File.exist?(workletsPath)
if hasWorklets
  Pod::UI.puts("[VisionCamera] react-native-worklets-core found at #{workletsPath}, Frame Processors are #{enableFrameProcessors ? "enabled" : "disabled"}!")
else
  Pod::UI.puts("[VisionCamera] react-native-worklets-core not found - Frame Processors are disabled!")
  enableFrameProcessors = false
end

$new_arch_enabled = ENV['RCT_NEW_ARCH_ENABLED'] == '1'
fabric_flags = $new_arch_enabled ? '-DRCT_NEW_ARCH_ENABLED' : ''

Pod::Spec.new do |s|
  s.name         = "VisionCamera"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.description  = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => "13.0" }
  s.source       = { :git => "https://github.com/mrousavy/react-native-vision-camera.git", :tag => "#{s.version}" }

  s.pod_target_xcconfig = {
    "GCC_PREPROCESSOR_DEFINITIONS" => "$(inherited) VISION_CAMERA_ENABLE_FRAME_PROCESSORS=#{enableFrameProcessors}",
    "SWIFT_ACTIVE_COMPILATION_CONDITIONS" => "$(inherited) #{enableFrameProcessors ? "VISION_CAMERA_ENABLE_FRAME_PROCESSORS" : ""}",
    "OTHER_SWIFT_FLAGS" => "$(inherited)" + " " + fabric_flags,
    "USE_HEADERMAP" => "YES",
    "DEFINES_MODULE" => "YES",
  }
  s.xcconfig = {
    "OTHER_CFLAGS" => "$(inherited)" + " " + fabric_flags
  }

  s.requires_arc = true

  s.subspec 'Core' do |core|
    # VisionCamera Core Swift codebase
    core.source_files = [
      "ios/Core/**/*.swift"
    ]

    core.pod_target_xcconfig = {
      "SWIFT_ACTIVE_COMPILATION_CONDITIONS" => "$(inherited) #{enableLocation ? "VISION_CAMERA_ENABLE_LOCATION" : ""}",
    }
  end

  s.subspec 'React' do |react|
    # VisionCamera React-specific Swift codebase
    react.source_files = [
      "ios/React/**/*.swift",
      "ios/React/**/*.{h,m,mm}",
    ]
    react.public_header_files = [
      "ios/React/CameraBridge.h"
    ]

    # TODO: can those dependecies be removed now that we have install_modules_... ?
    react.dependency "React-Core"
    react.dependency "Yoga"
    if enableFrameProcessors
      react.dependency "VisionCamera/FrameProcessors"
    end
    
    install_modules_dependencies(react)
  end

  if enableFrameProcessors
    s.subspec 'FrameProcessors' do |fp|
      # VisionCamera Frame Processors C++ codebase (optional)
      fp.source_files = [
        "ios/FrameProcessors/**/*.{h,m,mm}"
      ]
      fp.public_header_files = [
        # Swift/Objective-C visible headers
        "ios/FrameProcessors/Frame.h",
        "ios/FrameProcessors/FrameProcessor.h",
        "ios/FrameProcessors/FrameProcessorPlugin.h",
        "ios/FrameProcessors/FrameProcessorPluginRegistry.h",
        "ios/FrameProcessors/SharedArray.h",
        "ios/FrameProcessors/VisionCameraProxyDelegate.h",
        "ios/FrameProcessors/VisionCameraProxyHolder.h",
        "ios/FrameProcessors/VisionCameraInstaller.h",
      ]

      install_modules_dependencies(fp)
      fp.dependency "react-native-worklets-core"
    end
  end

  hash = s.to_hash
  UI.puts "hash: #{hash}"
end
