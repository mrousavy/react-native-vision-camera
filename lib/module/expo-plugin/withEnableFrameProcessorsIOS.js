import { withDangerousMod } from '@expo/config-plugins';
import { writeToPodfile } from './writeToPodfile';

/**
 * Set the `enableFrameProcessors` flag inside of the XcodeProject.
 * This is used to disable frame processors if you don't need it on iOS. (will save CPU and Memory)
 */
export const withEnableFrameProcessorsIOS = (c, enableFrameProcessors) => {
  return withDangerousMod(c, ['ios', config => {
    writeToPodfile(config.modRequest.projectRoot, '$VCEnableFrameProcessors', String(enableFrameProcessors));
    return config;
  }]);
};
//# sourceMappingURL=withEnableFrameProcessorsIOS.js.map