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

    const inheritKey = '"$(inherited)"';
    const valueKey = '"VISION_CAMERA_DISABLE_FRAME_PROCESSORS=1"';

    for (const key in configurations) {
      const buildSettings = configurations[key].buildSettings;
      if (buildSettings == null) continue;

      const preprocessorDefinitions = (buildSettings.GCC_PREPROCESSOR_DEFINITIONS ?? [inheritKey]) as string[];

      if (!preprocessorDefinitions.includes(valueKey)) preprocessorDefinitions.push(valueKey);
      buildSettings.GCC_PREPROCESSOR_DEFINITIONS = preprocessorDefinitions;
    }
    return config;
  });
};
