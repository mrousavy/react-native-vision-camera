import type { ConfigPlugin } from '@expo/config-plugins'
import { withPodfileProperties } from '@expo/config-plugins'

/**
 * Set the `enableLocation` flag inside of the XcodeProject.
 * This is used to enable location APIs.
 */
export const withEnableLocationIOS: ConfigPlugin = (c) => {
  return withPodfileProperties(c, (config) => {
    // TODO: Implement Podfile writing
    config.ios = config.ios
    return config
  })
}
