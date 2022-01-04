/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ConfigPlugin, withXcodeProject, XcodeProject } from '@expo/config-plugins';

/**
 * Set the `disableFrameProcessors` inside of the XcodeProject.
 * This is used to disable frame processors if you don't need it on iOS. (will save CPU and Memory)
 */
export const withDisableFrameProcessorsIOS: ConfigPlugin = (c) => {
  return withXcodeProject(c, (config) => {
    const xcodeProject: XcodeProject = config.modResults;

    const configurations = xcodeProject.pbxXCBuildConfigurationSection();
    let key;
    let buildSettings;

    const inheritKey = '"$(inherited)"';
    const valueKey = '"VISION_CAMERA_DISABLE_FRAME_PROCESSORS=1"';

    for (key in configurations) {
      buildSettings = configurations[key].buildSettings;
      if (typeof buildSettings?.GCC_PREPROCESSOR_DEFINITIONS !== 'undefined') {
        // alright, this is the DEBUG config, push our setting to it
        if (buildSettings.GCC_PREPROCESSOR_DEFINITIONS.includes(valueKey) === false)
          buildSettings.GCC_PREPROCESSOR_DEFINITIONS.push(valueKey);
      } else if (typeof buildSettings !== 'undefined') {
        // new projects do not have GCC_PREPROCESSOR_DEFINITIONS for "Release", lets create it
        // we need to add the inheritKey or it will break the release build.
        buildSettings.GCC_PREPROCESSOR_DEFINITIONS = [inheritKey, valueKey];
      }
    }
    return config;
  });
};
