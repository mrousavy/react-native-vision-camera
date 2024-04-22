import type { ConfigPlugin } from '@expo/config-plugins'
import { withGradleProperties } from '@expo/config-plugins'

/**
 * Set the `VisionCamera_enableFrameProcessors` value in the static `gradle.properties` file.
 * This is used to disable frame processors if you don't need it for android.
 */
export const withEnableFrameProcessorsAndroid: ConfigPlugin<boolean> = (c, enableFrameProcessors) => {
  const enableFrameProcessorsKey = 'VisionCamera_enableFrameProcessors'
  return withGradleProperties(c, (config) => {
    config.modResults = config.modResults.filter((item) => {
      if (item.type === 'property' && item.key === enableFrameProcessorsKey) return false
      return true
    })

    config.modResults.push({
      type: 'property',
      key: enableFrameProcessorsKey,
      value: String(enableFrameProcessors),
    })

    return config
  })
}
