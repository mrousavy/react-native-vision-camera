import { AndroidConfig, ConfigPlugin, withAndroidManifest } from '@expo/config-plugins'

const { addMetaDataItemToMainApplication, getMainApplicationOrThrow } = AndroidConfig.Manifest

export const withAndroidMLKitVisionModel: ConfigPlugin = (config) => {
  return withAndroidManifest(config, (conf) => {
    const androidManifest = conf.modResults

    const mainApplication = getMainApplicationOrThrow(androidManifest)

    addMetaDataItemToMainApplication(mainApplication, 'com.google.mlkit.vision.DEPENDENCIES', 'barcode')

    conf.modResults = androidManifest

    return conf
  })
}
