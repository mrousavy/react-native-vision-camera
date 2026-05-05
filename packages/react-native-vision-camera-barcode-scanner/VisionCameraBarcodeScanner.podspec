require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "VisionCameraBarcodeScanner"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => min_ios_version_supported, :visionos => 1.0 }
  s.source       = { :git => "https://github.com/mrousavy/nitro.git", :tag => "#{s.version}" }

  s.source_files = [
    # Implementation (Swift)
    "ios/**/*.{swift}",
    # Autolinking/Registration (Objective-C++)
    "ios/**/*.{m,mm}",
    # Implementation (C++ objects)
    "cpp/**/*.{hpp,cpp}",
  ]
  s.frameworks = ["AVFoundation"]

  # Google MLKit ships only an `ios-arm64` slice (no arm64-simulator). To let
  # consuming apps build for the iOS Simulator on Apple Silicon, this pod's
  # Swift code is gated with `#if !targetEnvironment(simulator)` so no MLKit
  # symbols are referenced when building for the simulator. See
  # `mlkit_simulator_patch.rb` for the matching post_install hook that strips
  # MLKit linking from the consumer app's simulator build.
  s.pod_target_xcconfig = {
    'EXCLUDED_SOURCE_FILE_NAMES[sdk=iphonesimulator*]' => '',
    'VALIDATE_WORKSPACE' => 'NO'
  }

  load 'nitrogen/generated/ios/VisionCameraBarcodeScanner+autolinking.rb'
  add_nitrogen_files(s)

  s.dependency 'GoogleMLKit/BarcodeScanning', '8.0.0'
  s.dependency 'VisionCamera'
  s.dependency 'React-jsi'
  s.dependency 'React-callinvoker'
  install_modules_dependencies(s)
end
