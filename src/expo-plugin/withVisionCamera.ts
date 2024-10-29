import type { ConfigPlugin } from '@expo/config-plugins'
import { withPlugins, AndroidConfig, createRunOncePlugin } from '@expo/config-plugins'
import { withEnableFrameProcessorsAndroid } from './withEnableFrameProcessorsAndroid'
import { withEnableFrameProcessorsIOS } from './withEnableFrameProcessorsIOS'
import { withAndroidMLKitVisionModel } from './withAndroidMLKitVisionModel'
import type { ConfigProps } from './@types'
import { withEnableLocationIOS } from './withEnableLocationIOS'
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
  if (props.enableLocation) {
    // Location permission
    config.ios.infoPlist.NSLocationWhenInUseUsageDescription =
      props.locationPermissionText ?? (config.ios.infoPlist.NSLocationWhenInUseUsageDescription as string | undefined) ?? LOCATION_USAGE
  }
  const androidPermissions = ['android.permission.CAMERA']
  if (props.enableMicrophonePermission) androidPermissions.push('android.permission.RECORD_AUDIO')
  if (props.enableLocation) androidPermissions.push('android.permission.ACCESS_FINE_LOCATION')

  if (props.enableLocation != null) {
    // set Podfile property to build location-related stuff
    config = withEnableLocationIOS(config, props.enableLocation)
  }
  if (props.enableFrameProcessors != null) {
    // set Podfile property to build frame-processor-related stuff
    config = withEnableFrameProcessorsAndroid(config, props.enableFrameProcessors)
    config = withEnableFrameProcessorsIOS(config, props.enableFrameProcessors)
  }

  if (props.enableCodeScanner) config = withAndroidMLKitVisionModel(config, props)

  return withPlugins(config, [[AndroidConfig.Permissions.withPermissions, androidPermissions]])
}

export default createRunOncePlugin(withCamera, pkg.name, pkg.version)
