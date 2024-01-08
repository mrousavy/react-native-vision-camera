import { ConfigPlugin, withAppBuildGradle } from '@expo/config-plugins'
import { ConfigProps } from './@types'

export const withAndroidMLKitVisionModel: ConfigPlugin<ConfigProps> = (config) => {
  return withAppBuildGradle(config, (conf) => {
    const buildGradle = conf.modResults
    const implementation = "implementation 'com.google.mlkit:barcode-scanning:17.2.0'"

    if (buildGradle.contents.includes(implementation) === false) {
      // Inspired by https://github.com/invertase/react-native-firebase/blob/main/packages/app/plugin/src/android/buildscriptDependency.ts
      // TODO: Find a better way to do this
      buildGradle.contents = buildGradle.contents.replace(
        /dependencies\s?{/,
        `dependencies {
    ${implementation}`,
      )
    }

    return conf
  })
}
