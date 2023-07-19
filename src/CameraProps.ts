import type { ViewProps } from 'react-native';
import type { CameraDevice, CameraDeviceFormat, ColorSpace, VideoStabilizationMode } from './CameraDevice';
import type { CameraRuntimeError } from './CameraError';
import type { DrawableFrame, Frame } from './Frame';
import type { Orientation } from './Orientation';

export type FrameProcessor =
  | {
      frameProcessor: (frame: Frame) => void;
      type: 'frame-processor';
    }
  | {
      frameProcessor: (frame: DrawableFrame) => void;
      type: 'skia-frame-processor';
    };

export interface CameraProps extends ViewProps {
  /**
   * The Camera Device to use.
   *
   * See the [Camera Devices](https://mrousavy.github.io/react-native-vision-camera/docs/guides/devices) section in the documentation for more information about Camera Devices.
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
   * Whether the Camera should actively stream video frames, or not. See the [documentation about the `isActive` prop](https://mrousavy.github.io/react-native-vision-camera/docs/guides/lifecycle#the-isactive-prop) for more information.
   *
   * This can be compared to a Video component, where `isActive` specifies whether the video is paused or not.
   *
   * > Note: If you fully unmount the `<Camera>` component instead of using `isActive={false}`, the Camera will take a bit longer to start again. In return, it will use less resources since the Camera will be completely destroyed when unmounted.
   */
  isActive: boolean;

  //#region Use-cases
  /**
   * Enables **photo capture** with the `takePhoto` function (see ["Taking Photos"](https://mrousavy.github.io/react-native-vision-camera/docs/guides/capturing#taking-photos))
   */
  photo?: boolean;
  /**
   * Enables **video capture** with the `startRecording` function (see ["Recording Videos"](https://mrousavy.github.io/react-native-vision-camera/docs/guides/capturing/#recording-videos))
   *
   * Note: If you want to use `video` and `frameProcessor` simultaneously, make sure [`supportsParallelVideoProcessing`](https://mrousavy.github.io/react-native-vision-camera/docs/guides/devices#the-supportsparallelvideoprocessing-prop) is `true`.
   */
  video?: boolean;
  /**
   * Enables **audio capture** for video recordings (see ["Recording Videos"](https://mrousavy.github.io/react-native-vision-camera/docs/guides/capturing/#recording-videos))
   */
  audio?: boolean;
  //#endregion

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
   * Specifies the zoom factor of the current camera, in "factor"/scale.
   *
   * This value ranges from `minZoom` (e.g. `1`) to `maxZoom` (e.g. `128`). It is recommended to set this value
   * to the CameraDevice's `neutralZoom` per default and let the user zoom out to the fish-eye (ultra-wide) camera
   * on demand (if available)
   *
   * **Note:** Linearly increasing this value always appears logarithmic to the user.
   *
   * @default 1.0
   */
  zoom?: number;
  /**
   * Enables or disables the native pinch to zoom gesture.
   *
   * If you want to implement a custom zoom gesture, see [the Zooming with Reanimated documentation](https://mrousavy.github.io/react-native-vision-camera/docs/guides/animated).
   *
   * @default false
   */
  enableZoomGesture?: boolean;
  //#endregion

  //#region Format/Preset selection
  /**
   * Selects a given format. By default, the best matching format is chosen.
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
  /**
   * Specifies the video stabilization mode to use for this camera device. Make sure the given `format` contains the given `videoStabilizationMode`.
   *
   * Requires `format` to be set.
   * @platform iOS
   */
  videoStabilizationMode?: VideoStabilizationMode;
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
   * Indicates whether the Camera should prepare the photo pipeline to provide maximum quality photos.
   *
   * This enables:
   * * High Resolution Capture ([`isHighResolutionCaptureEnabled`](https://developer.apple.com/documentation/avfoundation/avcapturephotooutput/1648721-ishighresolutioncaptureenabled))
   * * Virtual Device fusion for greater detail ([`isVirtualDeviceConstituentPhotoDeliveryEnabled`](https://developer.apple.com/documentation/avfoundation/avcapturephotooutput/3192189-isvirtualdeviceconstituentphotod))
   * * Dual Device fusion for greater detail ([`isDualCameraDualPhotoDeliveryEnabled`](https://developer.apple.com/documentation/avfoundation/avcapturephotosettings/2873917-isdualcameradualphotodeliveryena))
   * * Sets the maximum quality prioritization to `.quality` ([`maxPhotoQualityPrioritization`](https://developer.apple.com/documentation/avfoundation/avcapturephotooutput/3182995-maxphotoqualityprioritization))
   *
   * @default false
   */
  enableHighQualityPhotos?: boolean;
  /**
   * If `true`, show a debug view to display the FPS of the Camera session.
   * This is useful for debugging your Frame Processor's speed.
   *
   * @default false
   */
  enableFpsGraph?: boolean;
  /**
   * Represents the orientation of all Camera Outputs (Photo, Video, and Frame Processor). If this value is not set, the device orientation is used.
   */
  orientation?: Orientation;

  //#region Events
  /**
   * Called when any kind of runtime error occured.
   */
  onError?: (error: CameraRuntimeError) => void;
  /**
   * Called when the camera was successfully initialized.
   */
  onInitialized?: () => void;
  /**
   * A worklet which will be called for every frame the Camera "sees".
   *
   * If {@linkcode previewType | previewType} is set to `"skia"`, you can draw content to the `Frame` using the react-native-skia API.
   *
   * Note: If you want to use `video` and `frameProcessor` simultaneously, make sure [`supportsParallelVideoProcessing`](https://mrousavy.github.io/react-native-vision-camera/docs/guides/devices#the-supportsparallelvideoprocessing-prop) is `true`.
   *
   * > See [the Frame Processors documentation](https://mrousavy.github.io/react-native-vision-camera/docs/guides/frame-processors) for more information
   *
   * @example
   * ```tsx
   * const frameProcessor = useFrameProcessor((frame) => {
   *   'worklet'
   *   const qrCodes = scanQRCodes(frame)
   *   console.log(`Detected QR Codes: ${qrCodes}`)
   * }, [])
   *
   * return <Camera {...cameraProps} frameProcessor={frameProcessor} />
   * ```
   */
  frameProcessor?: FrameProcessor;
  //#endregion
}
