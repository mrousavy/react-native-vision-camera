require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "VisionCamera"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => "11.0" }
  s.source       = { :git => "https://github.com/cuvent/react-native-vision-camera.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm,swift}", "cpp/**/*.{h,cpp}"

  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES' }
  s.private_header_files = "ios/JSI Utils/**/*.h", "cpp/**/*.h", "ios/Vision/**/*.h"

  s.dependency "React-Core"
end
