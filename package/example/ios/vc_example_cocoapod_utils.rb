# Let's use ReactNativePodsUtils utility class to make it more maintainable
require Pod::Executable.execute_command('node', ['-p',
  'require.resolve(
    "react-native/scripts/cocoapods/utils.rb",
    {paths: [process.argv[1]]},
  )', __dir__]).strip

#
# In order to compile the project with disabled frame processors mode
# the codebase of example swift frame processor plugin needs to be put
# behind the swift compiler flag
# 
# Let's set the flag based on the same logic like in library's podspec file
# 
def set_frame_processor_swift_flag_in_example_project(installer)
  has_worklets = does_example_have_worklets_enabled(installer)
  set_swift_compiler_flag_in_project(installer, has_worklets)
end

def does_example_have_worklets_enabled(installer)
  forceDisableFrameProcessors = false
  if defined?($VCDisableFrameProcessors)
    forceDisableFrameProcessors = true
  end
  has_worklets = ReactNativePodsUtils.has_pod(installer, "react-native-worklets-core") && !forceDisableFrameProcessors
end

# 
# It's similar to:
# - [`ReactNativePodsUtils.add_compiler_flag_to_project`](https://github.com/facebook/react-native/blob/ad5213718377017ec6d2a057541f6d4c57e0507d/packages/react-native/scripts/cocoapods/utils.rb#L384)
# - [`ReactNativePodsUtils.remove_compiler_flag_from_project`](https://github.com/facebook/react-native/blob/ad5213718377017ec6d2a057541f6d4c57e0507d/packages/react-native/scripts/cocoapods/utils.rb#L395)
# but uses utils for setting "OTHER_SWIFT_FLAGS" compiler flag, which is unsupported by ReactNativePodsUtils
# 
def set_swift_compiler_flag_in_project(installer, has_worklets)
  projects = ReactNativePodsUtils.extract_projects(installer)
  projects.each do |project|
    project.build_configurations.each do |config|
      flag = "-DVISION_CAMERA_ENABLE_FRAME_PROCESSORS"
      if has_worklets
        set_swift_flag_in_config(config, flag)
      else
        remove_swift_flag_in_config(config, flag)
      end
    end
    project.save()
  end
end

# 
# It's similar to [`ReactNativePodsUtils.set_flag_in_config`](https://github.com/facebook/react-native/blob/ad5213718377017ec6d2a057541f6d4c57e0507d/packages/react-native/scripts/cocoapods/utils.rb#L414),
# but supports "OTHER_SWIFT_FLAGS" compiler flag
# 
def set_swift_flag_in_config(config, flag)
  ReactNativePodsUtils.add_flag_for_key(config, flag, "OTHER_SWIFT_FLAGS")
end

# 
# It's similar to [`ReactNativePodsUtils.remove_flag_in_config`](https://github.com/facebook/react-native/blob/ad5213718377017ec6d2a057541f6d4c57e0507d/packages/react-native/scripts/cocoapods/utils.rb#L421),
# but supports "OTHER_SWIFT_FLAGS" compiler flag
# 
def remove_swift_flag_in_config(config, flag)
  ReactNativePodsUtils.remove_flag_for_key(config, flag, "OTHER_SWIFT_FLAGS")
end
