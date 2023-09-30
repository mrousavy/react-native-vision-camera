import { ConfigPlugin, withPodfileProperties } from '@expo/config-plugins'

/**
 * Set the `disableFrameProcessors` inside of the XcodeProject.
 * This is used to disable frame processors if you don't need it on iOS. (will save CPU and Memory)
 */
export const withDisableFrameProcessorsIOS: ConfigPlugin = (c) => {
  return withPodfileProperties(c, (config) => {
    // TODO: Implement Podfile writing
    config.ios = config.ios
    return config
  })
}
