import { withPlugins, AndroidConfig, ConfigPlugin, createRunOncePlugin } from '@expo/config-plugins'
import { withDisableFrameProcessorsAndroid } from './withDisableFrameProcessorsAndroid'
import { withDisableFrameProcessorsIOS } from './withDisableFrameProcessorsIOS'
import { withAndroidMLKitVisionModel } from './withAndroidMLKitVisionModel'
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
const pkg = require('../../../package.json')

const CAMERA_USAGE = 'Allow $(PRODUCT_NAME) to access your camera'
const MICROPHONE_USAGE = 'Allow $(PRODUCT_NAME) to access your microphone'

type Props = {
  /**
   * The text to show in the native dialog when asking for Camera Permissions.
   * @default 'Allow $(PRODUCT_NAME) to access your camera'
   */
  cameraPermissionText?: string
  /**
   * Whether to add Microphone Permissions to the native manifest or not.
   * @default false
   */
  enableMicrophonePermission?: boolean
  /**
   * The text to show in the native dialog when asking for Camera Permissions.
   * @default 'Allow $(PRODUCT_NAME) to access your microphone'
   */
  microphonePermissionText?: string
  /**
   * Whether to enable the Frame Processors runtime, or explicitly disable it.
   * Disabling Frame Processors will make your app smaller as the C++ files will not be compiled.
   * See [Frame Processors](https://www.react-native-vision-camera.com/docs/guides/frame-processors)
   * @default false
   */
  disableFrameProcessors?: boolean
  /**
   * Whether to enable the QR/Barcode Scanner Model. If true, the MLKit Model will
   * automatically be downloaded on app startup. If false, it will be downloaded
   * once the Camera is created with a `CodeScanner`.
   * See [QR/Barcode Scanning](https://www.react-native-vision-camera.com/docs/guides/code-scanning)
   * @default false
   */
  enableCodeScanner?: boolean
}

const withCamera: ConfigPlugin<Props> = (config, props = {}) => {
  if (config.ios == null) config.ios = {}
  if (config.ios.infoPlist == null) config.ios.infoPlist = {}
  config.ios.infoPlist.NSCameraUsageDescription =
    props.cameraPermissionText ?? (config.ios.infoPlist.NSCameraUsageDescription as string | undefined) ?? CAMERA_USAGE
  if (props.enableMicrophonePermission) {
    config.ios.infoPlist.NSMicrophoneUsageDescription =
      props.microphonePermissionText ?? (config.ios.infoPlist.NSMicrophoneUsageDescription as string | undefined) ?? MICROPHONE_USAGE
  }
  const androidPermissions = ['android.permission.CAMERA']
  if (props.enableMicrophonePermission) androidPermissions.push('android.permission.RECORD_AUDIO')

  if (props.disableFrameProcessors) {
    config = withDisableFrameProcessorsAndroid(config)
    config = withDisableFrameProcessorsIOS(config)
  }

  if (props.enableCodeScanner) {
    // Adds meta download-request tag to AndroidManifest
    config = withAndroidMLKitVisionModel(config)
  }

  return withPlugins(config, [[AndroidConfig.Permissions.withPermissions, androidPermissions]])
}

export default createRunOncePlugin(withCamera, pkg.name, pkg.version)
