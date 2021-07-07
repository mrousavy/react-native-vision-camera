import { withPlugins, AndroidConfig, ConfigPlugin, createRunOncePlugin } from '@expo/config-plugins';
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
const pkg = require('../../package.json');

const CAMERA_USAGE = 'Allow $(PRODUCT_NAME) to access your camera';
const MICROPHONE_USAGE = 'Allow $(PRODUCT_NAME) to access your microphone';

type CameraPermissionProps = {
  /**
   * Specifies the Text that should appear in the Permission Alert.
   * @default 'Allow $(PRODUCT_NAME) to access your camera'
   */
  cameraPermissionText?: string;
};
type MicrophonePermissionProps =
  | {
      /**
       * Enables or disables the Microphone Permission. Only enable this feature if you want to use `audio={true}`.
       *
       * @default false
       */
      enableMicrophonePermission?: false;
    }
  | {
      /**
       * Enables or disables the Microphone Permission. Only enable this feature if you want to use `audio={true}`.
       *
       * @default false
       */
      enableMicrophonePermission: true;
      /**
       * Specifies the Text that should appear in the Permission Alert.
       * @default 'Allow $(PRODUCT_NAME) to access your microphone'
       */
      microphonePermissionText?: string;
    };

type Props = CameraPermissionProps & MicrophonePermissionProps;

const withCamera: ConfigPlugin<Props> = (config, props = {}) => {
  if (config.ios == null) config.ios = {};
  if (config.ios.infoPlist == null) config.ios.infoPlist = {};
  config.ios.infoPlist.NSCameraUsageDescription =
    props.cameraPermissionText ?? (config.ios.infoPlist.NSCameraUsageDescription as string | undefined) ?? CAMERA_USAGE;
  if (props.enableMicrophonePermission) {
    config.ios.infoPlist.NSMicrophoneUsageDescription =
      props.microphonePermissionText ?? (config.ios.infoPlist.NSMicrophoneUsageDescription as string | undefined) ?? MICROPHONE_USAGE;
  }
  const androidPermissions = ['android.permission.CAMERA'];
  if (props.enableMicrophonePermission) androidPermissions.push('android.permission.RECORD_AUDIO');

  return withPlugins(config, [[AndroidConfig.Permissions.withPermissions, androidPermissions]]);
};

export default createRunOncePlugin(withCamera, pkg.name, pkg.version);
