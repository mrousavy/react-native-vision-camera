import type { ViewProps } from 'react-native'
import type { CameraDevice, CameraDeviceFormat, VideoStabilizationMode } from './CameraDevice'
import type { CameraRuntimeError } from './CameraError'
import { CodeScanner } from './CodeScanner'
import type { Frame } from './Frame'
import type { Orientation } from './Orientation'

export type FrameProcessor = {
  frameProcessor: (frame: Frame) => void
  type: 'frame-processor'
}

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
  device: CameraDevice
  /**
   * Whether the Camera should actively stream video frames, or not. See the [documentation about the `isActive` prop](https://react-native-vision-camera.com/docs/guides/lifecycle#the-isactive-prop) for more information.
   *
   * This can be compared to a Video component, where `isActive` specifies whether the video is paused or not.
   *
   * > Note: If you fully unmount the `<Camera>` component instead of using `isActive={false}`, the Camera will take a bit longer to start again. In return, it will use less resources since the Camera will be completely destroyed when unmounted.
   */
  isActive: boolean

  //#region Use-cases
  /**
   * Enables **photo capture** with the `takePhoto` function (see ["Taking Photos"](https://react-native-vision-camera.com/docs/guides/taking-photos))
   */
  photo?: boolean
  /**
   * Enables **video capture** with the `startRecording` function (see ["Recording Videos"](https://react-native-vision-camera.com/docs/guides/recording-videos))
   */
  video?: boolean
  /**
   * Enables **audio capture** for video recordings (see ["Recording Videos"](https://react-native-vision-camera.com/docs/guides/recording-videos))
   */
  audio?: boolean
  /**
   * Specifies the pixel format for the video pipeline.
   *
   * Make sure the given {@linkcode format} supports the given {@linkcode pixelFormat}.
   *
   * Affects:
   * * {@linkcode frameProcessor}: The format of Frames from a [Frame Processor](https://react-native-vision-camera.com/docs/guides/frame-processors).
   * While `'native'` and `'yuv'` are the most efficient formats, some ML models (such as TensorFlow Face Detection Models) require input Frames to be in RGB colorspace, otherwise they just output nonsense.
   * * {@linkcode video}: The format of Frames streamed in the Video Pipeline. The format `'native'` is most efficient here.
   *
   * The following values are supported:
   *
   * - `native`: The hardware native GPU buffer format. This is the most efficient format. (`PRIVATE` on Android, sometimes YUV on iOS)
   * - `yuv`: The YUV (Y'CbCr 4:2:0 or NV21, 8-bit) format, either video- or full-range, depending on hardware capabilities. This is the second most efficient format.
   * - `rgb`: The RGB (RGB, RGBA or ABGRA, 8-bit) format. This is least efficient and requires explicit conversion.
   *
   * @default
   * - Without a Frame Processor: `native`
   * - With a Frame Processor: `yuv`
   */
  pixelFormat?: 'native' | 'yuv' | 'rgb'
  //#endregion

  //#region Common Props (torch, zoom)
  /**
   * Set the current torch mode.
   *
   * Make sure the given {@linkcode device} has a torch (see {@linkcode CameraDevice.hasTorch device.hasTorch}).
   *
   * @default "off"
   */
  torch?: 'off' | 'on'
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
  zoom?: number
  /**
   * Enables or disables the native pinch to zoom gesture.
   *
   * If you want to implement a custom zoom gesture, see [the Zooming with Reanimated documentation](https://react-native-vision-camera.com/docs/guides/zooming).
   *
   * @default false
   */
  enableZoomGesture?: boolean
  //#endregion

  //#region Camera Controls
  /**
   * Specifies the Exposure bias of the current camera. A lower value means darker images, a higher value means brighter images.
   *
   * The Camera will still continue to auto-adjust exposure and focus, but will premultiply the exposure setting with the provided value here.
   *
   * This values ranges from {@linkcode CameraDevice.minExposure device.minExposure} to {@linkcode CameraDevice.maxExposure device.maxExposure}.
   *
   * The value between min- and max supported exposure is considered the default, neutral value.
   */
  exposure?: number
  //#endregion

  //#region Format/Preset selection
  /**
   * Selects a given format. By default, the best matching format is chosen. See {@linkcode CameraDeviceFormat}
   *
   * The format defines the possible values for properties like:
   * - {@linkcode fps}: `format.minFps`...`format.maxFps`
   * - {@linkcode videoHdr}: `format.supportsVideoHdr`
   * - {@linkcode photoHdr}: `format.supportsPhotoHdr`
   * - {@linkcode pixelFormat}: `format.pixelFormats``
   * - {@linkcode enableDepthData}: `format.supportsDepthCapture``
   * - {@linkcode videoStabilizationMode}: `format.videoStabilizationModes``
   *
   * In other words; {@linkcode enableDepthData} can only be set to true if {@linkcode CameraDeviceFormat.supportsDepthCapture format.supportsDepthCapture} is true.
   */
  format?: CameraDeviceFormat
  /**
   * Specifies the Preview's resize mode.
   * * `"cover"`: Keep aspect ratio and fill entire parent view (centered).
   * * `"contain"`: Keep aspect ratio and make sure the entire content is visible inside the parent view, even if it introduces additional blank areas (centered).
   *
   * @default "cover"
   */
  resizeMode?: 'cover' | 'contain'
  /**
   * Specify the frames per second this camera should stream frames at.
   *
   * Make sure the given {@linkcode format} can stream at the target {@linkcode fps} value (see {@linkcode CameraDeviceFormat.minFps format.minFps} and {@linkcode CameraDeviceFormat.maxFps format.maxFps}).
   */
  fps?: number
  /**
   * Enables or disables HDR Video Streaming for Preview, Video and Frame Processor via a 10-bit wide-color pixel format.
   *
   * Make sure the given {@linkcode format} supports HDR (see {@linkcode CameraDeviceFormat.supportsVideoHdr format.supportsVideoHdr}).
   */
  videoHdr?: boolean
  /**
   * Enables or disables HDR Photo Capture via a double capture routine that combines low- and high exposure photos.
   *
   * Make sure the given {@linkcode format} supports HDR (see {@linkcode CameraDeviceFormat.supportsPhotoHdr format.supportsPhotoHdr}).
   */
  photoHdr?: boolean
  /**
   * Enables or disables lossy buffer compression for the video stream.
   * If you only use {@linkcode video} or a {@linkcode frameProcessor}, this
   * can increase the efficiency and lower memory usage of the Camera.
   *
   * If buffer compression is enabled, the video pipeline will try to use a
   * lossy-compressed pixel format instead of the normal one.
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
   * - true // if frameProcessor={undefined}
   * - false // otherwise
   */
  enableBufferCompression?: boolean
  /**
   * Enables or disables GPU-sampled buffers for the video stream. This only takes effect when using a {@linkcode frameProcessor}.
   *
   * When recording a Video ({@linkcode video}) while a Frame Processor is running ({@linkcode frameProcessor}),
   * the {@linkcode Frame | Frames} will need to be forwarded to the Media Encoder.
   *
   * - When `enableGpuBuffers` is `false`, the Video Pipeline will use CPU buffers causing an additional copy
   * from the Frame Processor to the Media Encoder, which potentially results in increased latency.
   * - When `enableGpuBuffers` is `true`, the Video Pipeline will use shared GPU buffers which greatly increases
   * it's efficiency as an additional buffer copy is avoided.
   * (See [`USAGE_GPU_SAMPLED_IMAGE`](https://developer.android.com/reference/android/hardware/HardwareBuffer#USAGE_GPU_SAMPLED_IMAGE))
   *
   * In general, it is recommended to set this to `true` if possible, as this can increase performance and efficiency of the Video Pipeline.
   *
   * @experimental This is an experimental feature flag, use at your own risk. Some devices (especially Samsungs) may crash when trying to use GPU buffers.
   * @platform Android (API 29+)
   * @default false
   */
  enableGpuBuffers?: boolean
  /**
   * Enables or disables low-light boost on this camera device.
   *
   * Make sure the given {@linkcode device} supports low-light-boost (see {@linkcode CameraDevice.supportsLowLightBoost device.supportsLowLightBoost}).
   */
  lowLightBoost?: boolean
  /**
   * Specifies the video stabilization mode to use.
   *
   * Make sure the given {@linkcode format} supports the given {@linkcode videoStabilizationMode}.
   */
  videoStabilizationMode?: VideoStabilizationMode
  //#endregion

  /**
   * Enables or disables depth data delivery for photo capture.
   *
   * Make sure the given {@linkcode format} supports depth data (see {@linkcode CameraDeviceFormat.supportsDepthCapture format.supportsDepthCapture}).
   *
   * @default false
   */
  enableDepthData?: boolean
  /**
   * A boolean specifying whether the photo render pipeline is prepared for portrait effects matte delivery.
   *
   * When enabling this, you must also set `enableDepthData` to `true`.
   *
   * @platform iOS 12.0+
   * @default false
   */
  enablePortraitEffectsMatteDelivery?: boolean
  /**
   * Indicates whether the Camera should prepare the photo pipeline to provide maximum quality photos.
   *
   * This enables:
   * * High Resolution Capture ([`isHighResolutionCaptureEnabled`](https://developer.apple.com/documentation/avfoundation/avcapturephotooutput/1648721-ishighresolutioncaptureenabled))
   * * Virtual Device fusion for greater detail ([`isVirtualDeviceConstituentPhotoDeliveryEnabled`](https://developer.apple.com/documentation/avfoundation/avcapturephotooutput/3192189-isvirtualdeviceconstituentphotod))
   * * Dual Device fusion for greater detail ([`isDualCameraDualPhotoDeliveryEnabled`](https://developer.apple.com/documentation/avfoundation/avcapturephotosettings/2873917-isdualcameradualphotodeliveryena))
   * * Sets the maximum quality prioritization to `.quality` ([`maxPhotoQualityPrioritization`](https://developer.apple.com/documentation/avfoundation/avcapturephotooutput/3182995-maxphotoqualityprioritization))
   *
   * @platform iOS
   * @default false
   */
  enableHighQualityPhotos?: boolean
  /**
   * If `true`, show a debug view to display the FPS of the Camera session.
   * This is useful for debugging your Frame Processor's speed.
   *
   * @default false
   */
  enableFpsGraph?: boolean
  /**
   * Represents the orientation of all Camera Outputs (Photo, Video, and Frame Processor). If this value is not set, the device orientation is used.
   */
  orientation?: Orientation

  //#region Events
  /**
   * Called when any kind of runtime error occured.
   */
  onError?: (error: CameraRuntimeError) => void
  /**
   * Called when the camera session was successfully initialized. This will get called everytime a new device is set.
   */
  onInitialized?: () => void
  /**
   * Called when the camera started the session (`isActive={true}`)
   */
  onStarted?: () => void
  /**
   * Called when the camera stopped the session (`isActive={false}`)
   */
  onStopped?: () => void
  /**
   * A worklet which will be called for every frame the Camera "sees".
   *
   * > See [the Frame Processors documentation](https://react-native-vision-camera.com/docs/guides/frame-processors) for more information
   *
   * @example
   * ```tsx
   * const frameProcessor = useFrameProcessor((frame) => {
   *   'worklet'
   *   const faces = scanFaces(frame)
   *   console.log(`Faces: ${faces}`)
   * }, [])
   *
   * return <Camera {...cameraProps} frameProcessor={frameProcessor} />
   * ```
   */
  frameProcessor?: FrameProcessor
  /**
   * A CodeScanner that can detect QR-Codes or Barcodes using platform-native APIs.
   *
   * > See [the Code Scanner documentation](https://react-native-vision-camera.com/docs/guides/code-scanning) for more information
   *
   * @example
   * ```tsx
   * const codeScanner = useCodeScanner({
   *   codeTypes: ['qr', 'ean-13'],
   *   onCodeScanned: (codes) => {
   *     console.log(`Scanned ${codes.length} codes!`)
   *   }
   * })
   *
   * return <Camera {...props} codeScanner={codeScanner} />
   */
  codeScanner?: CodeScanner
  //#endregion
}
