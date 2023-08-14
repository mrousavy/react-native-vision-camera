/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { withXcodeProject } from '@expo/config-plugins';
/**
 * Set the `disableFrameProcessors` inside of the XcodeProject.
 * This is used to disable frame processors if you don't need it on iOS. (will save CPU and Memory)
 */

export const withDisableFrameProcessorsIOS = c => {
  return withXcodeProject(c, config => {
    const xcodeProject = config.modResults;
    const configurations = xcodeProject.pbxXCBuildConfigurationSection();
    const inheritKey = '"$(inherited)"';
    const valueKey = '"VISION_CAMERA_DISABLE_FRAME_PROCESSORS=1"';

    for (const key in configurations) {
      var _buildSettings$GCC_PR;

      const buildSettings = configurations[key].buildSettings;
      if (buildSettings == null) continue;
      const preprocessorDefinitions = (_buildSettings$GCC_PR = buildSettings.GCC_PREPROCESSOR_DEFINITIONS) !== null && _buildSettings$GCC_PR !== void 0 ? _buildSettings$GCC_PR : [inheritKey];
      if (!preprocessorDefinitions.includes(valueKey)) preprocessorDefinitions.push(valueKey);
      buildSettings.GCC_PREPROCESSOR_DEFINITIONS = preprocessorDefinitions;
    }

    return config;
  });
};
//# sourceMappingURL=withDisableFrameProcessorsIOS.js.map