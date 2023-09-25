import type { ViewProps } from 'react-native';
import type { CameraDevice, CameraDeviceFormat, VideoStabilizationMode } from './CameraDevice';
import type { CameraRuntimeError } from './CameraError';
import type { Frame } from './Frame';
import type { Orientation } from './Orientation';

export type FrameProcessor = {
  frameProcessor: (frame: Frame) => void;
  type: 'frame-processor';
};

// TODO: Replace `enableHighQualityPhotos: boolean` in favor of `priorization: 'photo' | 'video'`
// TODO: Use RCT_ENUM_PARSER for stuff like torch, videoStabilizationMode, and orientation
// TODO: Use Photo HostObject for stuff like depthData, portraitEffects, etc.
// TODO: Add RAW capture support

export interface CameraProps extends ViewProps {
  /**
   * The Camera Device to use.
   *
   * See the [Camera Devices](https://react-native-vision-camera.com/docs/guides/devices) section in the documentation for more information about Camera Devices.
   *
   * @example
   * ```tsx
   * const device = useCameraDevice('back')
   *
   * if (device == null) return <NoCameraErrorView />
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
   * Whether the Camera should actively stream video frames, or not. See the [documentation about the `isActive` prop](https://react-native-vision-camera.com/docs/guides/lifecycle#the-isactive-prop) for more information.
   *
   * This can be compared to a Video component, where `isActive` specifies whether the video is paused or not.
   *
   * > Note: If you fully unmount the `<Camera>` component instead of using `isActive={false}`, the Camera will take a bit longer to start again. In return, it will use less resources since the Camera will be completely destroyed when unmounted.
   */
  isActive: boolean;

  //#region Use-cases
  /**
   * Enables **photo capture** with the `takePhoto` function (see ["Taking Photos"](https://react-native-vision-camera.com/docs/guides/capturing#taking-photos))
   */
  photo?: boolean;
  /**
   * Enables **video capture** with the `startRecording` function (see ["Recording Videos"](https://react-native-vision-camera.com/docs/guides/capturing/#recording-videos))
   *
   * Note: If both the `photo` and `video` properties are enabled at the same time and the device is running at a `hardwareLevel` of `'legacy'` or `'limited'`, VisionCamera _might_ use a lower resolution for video capture due to hardware constraints.
   */
  video?: boolean;
  /**
   * Enables **audio capture** for video recordings (see ["Recording Videos"](https://react-native-vision-camera.com/docs/guides/capturing/#recording-videos))
   */
  audio?: boolean;
  /**
   * Specifies the pixel format for the video pipeline.
   *
   * Frames from a [Frame Processor](https://mrousavy.github.io/react-native-vision-camera/docs/guides/frame-processors) will be streamed in the pixel format specified here.
   *
   * While `native` and `yuv` are the most efficient formats, some ML models (such as MLKit Barcode detection) require input Frames to be in RGB colorspace, otherwise they just output nonsense.
   *
   * - `native`: The hardware native GPU buffer format. This is the most efficient format. (`PRIVATE` on Android, sometimes YUV on iOS)
   * - `yuv`: The YUV (Y'CbCr 4:2:0 or NV21, 8-bit) format, either video- or full-range, depending on hardware capabilities. This is the second most efficient format.
   * - `rgb`: The RGB (RGB, RGBA or ABGRA, 8-bit) format. This is least efficient and requires explicit conversion.
   *
   * @default `native`
   */
  pixelFormat?: 'native' | 'yuv' | 'rgb';
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
   * If you want to implement a custom zoom gesture, see [the Zooming with Reanimated documentation](https://react-native-vision-camera.com/docs/guides/animated).
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
   * Specifies the Preview's resize mode.
   * * `"cover"`: Keep aspect ratio and fill entire parent view (centered).
   * * `"contain"`: Keep aspect ratio and make sure the entire content is visible inside the parent view, even if it introduces additional blank areas (centered).
   *
   * @default "cover"
   */
  resizeMode?: 'cover' | 'contain';
  /**
   * Specify the frames per second this camera should use. Make sure the given `format` includes a frame rate range with the given `fps`.
   *
   * Requires `format` to be set that supports the given `fps`.
   */
  fps?: number;
  /**
   * Enables or disables HDR on this camera device. Make sure the given `format` supports HDR mode.
   *
   * Requires `format` to be set that supports `photoHDR`/`videoHDR`.
   */
  hdr?: boolean;
  /**
   * Enables or disables lossless buffer compression for the video stream.
   * If you only use {@linkcode video} or a {@linkcode frameProcessor}, this
   * can increase the efficiency and lower memory usage of the Camera.
   *
   * If buffer compression is enabled, the video pipeline will try to use a
   * lossless-compressed pixel format instead of the normal one.
   *
   * If you use a {@linkcode frameProcessor}, you might need to change how pixels
   * are read inside your native frame processor function as this is different
   * from the usual `yuv` or `rgb` layout.
   *
   * If buffer compression is not available but this property is enabled, the normal
   * pixel formats will be used and no error will be thrown.
   *
   * @platform iOS
   * @default
   * - true // if video={true} and frameProcessor={undefined}
   * - false // otherwise
   */
  enableBufferCompression?: boolean;
  /**
   * Enables or disables low-light boost on this camera device. Make sure the given `format` supports low-light boost.
   *
   * Requires a `format` to be set that supports `lowLightBoost`.
   */
  lowLightBoost?: boolean;
  /**
   * Specifies the video stabilization mode to use.
   *
   * Requires a `format` to be set that contains the given `videoStabilizationMode`.
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
