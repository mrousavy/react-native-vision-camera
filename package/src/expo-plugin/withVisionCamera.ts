import { withPlugins, AndroidConfig, ConfigPlugin, createRunOncePlugin } from '@expo/config-plugins'
import { withDisableFrameProcessorsAndroid } from './withDisableFrameProcessorsAndroid'
import { withDisableFrameProcessorsIOS } from './withDisableFrameProcessorsIOS'
import { withAndroidMLKitVisionModel } from './withAndroidMLKitVisionModel'
import { ConfigProps } from './@types'
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
const pkg = require('../../../package.json')

const CAMERA_USAGE = 'Allow $(PRODUCT_NAME) to access your camera'
const MICROPHONE_USAGE = 'Allow $(PRODUCT_NAME) to access your microphone'
const LOCATION_USAGE = 'Allow $(PRODUCT_NAME) to access your location'

const withCamera: ConfigPlugin<ConfigProps> = (config, props = {}) => {
  if (config.ios == null) config.ios = {}
  if (config.ios.infoPlist == null) config.ios.infoPlist = {}
  // Camera permission
  config.ios.infoPlist.NSCameraUsageDescription =
    props.cameraPermissionText ?? (config.ios.infoPlist.NSCameraUsageDescription as string | undefined) ?? CAMERA_USAGE
  if (props.enableMicrophonePermission) {
    // Microphone permission
    config.ios.infoPlist.NSMicrophoneUsageDescription =
      props.microphonePermissionText ?? (config.ios.infoPlist.NSMicrophoneUsageDescription as string | undefined) ?? MICROPHONE_USAGE
  }
  if (props.enableLocationPermission) {
    // Location permission
    config.ios.infoPlist.NSLocationWhenInUseUsageDescription =
      props.locationPermissionText ?? (config.ios.infoPlist.NSLocationWhenInUseUsageDescription as string | undefined) ?? LOCATION_USAGE
  }
  const androidPermissions = ['android.permission.CAMERA']
  if (props.enableMicrophonePermission) androidPermissions.push('android.permission.RECORD_AUDIO')
  if (props.enableLocationPermission) androidPermissions.push('android.permission.ACCESS_FINE_LOCATION')

  if (props.disableFrameProcessors) {
    config = withDisableFrameProcessorsAndroid(config)
    config = withDisableFrameProcessorsIOS(config)
  }

  if (props.enableCodeScanner) config = withAndroidMLKitVisionModel(config, props)

  return withPlugins(config, [[AndroidConfig.Permissions.withPermissions, androidPermissions]])
}

export default createRunOncePlugin(withCamera, pkg.name, pkg.version)
