import type { ConfigPlugin } from '@expo/config-plugins'
import { withAndroidManifest } from '@expo/config-plugins'

export const withRequireFeatureAndroid: ConfigPlugin<[string, boolean]> = (c, [featureName, featureIsRequired]) => {
  return withAndroidManifest(c, (config) => {
    if (!Array.isArray(config.modResults.manifest['uses-feature'])) config.modResults.manifest['uses-feature'] = []

    if (config.modResults.manifest['uses-feature'].find((item) => item.$['android:name'] === featureName) == null) {
      config.modResults.manifest['uses-feature'].push({
        $: {
          'android:name': featureName,
          'android:required': featureIsRequired ? 'true' : 'false',
        },
      })
    }

    return config
  })
}
