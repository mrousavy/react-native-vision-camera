import type { ViewProps } from 'react-native';
import type { CameraDevice, CameraDeviceFormat, ColorSpace } from './CameraDevice';
import type { CameraRuntimeError } from './CameraError';
import type { CameraPreset } from './CameraPreset';
import type { Code, CodeType } from './Code';

export interface CameraProps extends ViewProps {
  /**
   * The Camera Device to use.
   *
   * See the [Camera Devices](https://cuvent.github.io/react-native-vision-camera/docs/guides/devices) section in the documentation for more information about Camera Devices.
   *
   * @example
   * ```tsx
   * const devices = useCameraDevices('wide-angle-camera')
   * const device = devices.back
   *
   * return (
   *   <Camera
   *     device={device}
   *     isActive={true}
   *     style={StyleSheet.absoluteFill}
   *   />
   * )
   * ```
   */
  device: CameraDevice;
  /**
   * Whether the Camera should actively stream video frames, or not. See the [documentation about the `isActive` prop](https://cuvent.github.io/react-native-vision-camera/docs/guides/devices#the-isactive-prop) for more information.
   *
   * This can be compared to a Video component, where `isActive` specifies whether the video is paused or not.
   *
   * > Note: If you fully unmount the `<Camera>` component instead of using `isActive={false}`, the Camera will take a bit longer to start again. In return, it will use less resources since the Camera will be completely destroyed when unmounted.
   */
  isActive: boolean;

  //#region Common Props (torch, zoom)
  /**
   * Set the current torch mode.
   *
   * Note: The torch is only available on `"back"` cameras, and isn't supported by every phone.
   *
   * @default "off"
   */
  torch?: 'off' | 'on';
  /**
   * Specifies the zoom factor of the current camera, in percent. (`0.0` - `1.0`)
   *
   * **Note:** Linearly increasing this value always appears logarithmic to the user.
   *
   * @default 0.0
   */
  zoom?: number;
  /**
   * Enables or disables the native pinch to zoom gesture.
   *
   * If you want to implement a custom zoom gesture, see [the Zooming with Reanimated documentation](https://cuvent.github.io/react-native-vision-camera/docs/guides/animated).
   *
   * @default false
   */
  enableZoomGesture?: boolean;
  //#endregion

  //#region Format/Preset selection
  /**
   * Automatically selects a camera format which best matches the given preset. Must be `undefined` when `format` is set!
   */
  preset?: CameraPreset;
  /**
   * Selects a given format. Must be `undefined` when `preset` is set!
   */
  format?: CameraDeviceFormat;
  /**
   * Specify the frames per second this camera should use. Make sure the given `format` includes a frame rate range with the given `fps`.
   *
   * Requires `format` to be set.
   */
  fps?: number;
  /**
   * Enables or disables HDR on this camera device. Make sure the given `format` supports HDR mode.
   *
   * Requires `format` to be set.
   */
  hdr?: boolean;
  /**
   * Enables or disables low-light boost on this camera device. Make sure the given `format` supports low-light boost.
   *
   * Requires `format` to be set.
   */
  lowLightBoost?: boolean;
  /**
   * Specifies the color space to use for this camera device. Make sure the given `format` contains the given `colorSpace`.
   *
   * Requires `format` to be set.
   */
  colorSpace?: ColorSpace;
  //#endregion

  /**
   * Also captures data from depth-perception sensors. (e.g. disparity maps)
   *
   * @default false
   */
  enableDepthData?: boolean;
  /**
   * A boolean specifying whether the photo render pipeline is prepared for portrait effects matte delivery.
   *
   * When enabling this, you must also set `enableDepthData` to `true`.
   *
   * @platform iOS 12.0+
   * @default false
   */
  enablePortraitEffectsMatteDelivery?: boolean;
  /**
   * Indicates whether the photo render pipeline should be configured to deliver high resolution still images
   *
   * @default false
   */
  enableHighResolutionCapture?: boolean;

  //#region Events
  /**
   * Called when any kind of runtime error occured.
   */
  onError?: (error: CameraRuntimeError) => void;
  /**
   * Called when the camera was successfully initialized.
   */
  onInitialized?: () => void;

  // TODO: Remove once frameProcessors land
  /**
   * Specify the code types this camera can scan. Will be removed with the addition of Frame Processors.
   */
  scannableCodes?: CodeType[];
  // TODO: Remove once frameProcessors land
  /**
   * Called when one or multiple codes have been scanned. Will be removed with the addition of Frame Processors.
   */
  onCodeScanned?: (codes: Code[]) => void;
  //#endregion
}
