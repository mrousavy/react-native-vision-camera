import type { ConfigPlugin } from '@expo/config-plugins'
import { withPodfileProperties } from '@expo/config-plugins'

/**
 * Set the `enableFrameProcessors` flag inside of the XcodeProject.
 * This is used to disable frame processors if you don't need it on iOS. (will save CPU and Memory)
 */
export const withEnableFrameProcessorsIOS: ConfigPlugin<boolean> = (c, _enable) => {
  return withPodfileProperties(c, (config) => {
    // TODO: Implement Podfile writing
    config.ios = config.ios
    return config
  })
}
