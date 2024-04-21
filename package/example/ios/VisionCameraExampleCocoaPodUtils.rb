# Let's use ReactNativePodsUtils utility class to make it more maintainable
require Pod::Executable.execute_command('node', ['-p',
  'require.resolve(
    "react-native/scripts/cocoapods/utils.rb",
    {paths: [process.argv[1]]},
  )', __dir__]).strip

#
# In the CI we test the VisionCameraExample app build
# with Frame Processors disabled as well. To successfully compile
# with FPs disabled, we need to also compile out the custom Example
# FP Plugins I created - so let's set the Swift flag to compile it out.
#
def set_frame_processor_swift_flag_in_example_project(installer)
  enableFrameProcessors = get_enable_frame_processors(installer)
  set_swift_compiler_flag_in_project(installer, enableFrameProcessors)
end

def get_enable_frame_processors(installer)
  enableFrameProcessors = true
  if defined?($VCEnableFrameProcessors)
    enableFrameProcessors = $VCEnableFrameProcessors
  end
  enableFrameProcessors = ReactNativePodsUtils.has_pod(installer, "react-native-worklets-core") && enableFrameProcessors
end

def set_swift_compiler_flag_in_project(installer, enableFrameProcessors)
  projects = ReactNativePodsUtils.extract_projects(installer)
  projects.each do |project|
    project.build_configurations.each do |config|
      flag = "-DVISION_CAMERA_ENABLE_FRAME_PROCESSORS"
      if enableFrameProcessors
        Pod::UI.puts "Adding VISION_CAMERA_ENABLE_FRAME_PROCESSORS Swift flag to VisionCameraExample..."
        ReactNativePodsUtils.add_flag_for_key(config, flag, "OTHER_SWIFT_FLAGS")
      else
        Pod::UI.puts "Removing VISION_CAMERA_ENABLE_FRAME_PROCESSORS Swift flag from VisionCameraExample..."
        ReactNativePodsUtils.remove_flag_for_key(config, flag, "OTHER_SWIFT_FLAGS")
      end
    end
    project.save()
  end
end
