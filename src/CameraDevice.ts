import type { CameraPosition } from './CameraPosition';

/**
 * Indentifiers for a physical camera (one that actually exists on the back/front of the device)
 *
 * * `"ultra-wide-angle-camera"`: A built-in camera with a shorter focal length than that of a wide-angle camera. (focal length between below 24mm)
 * * `"wide-angle-camera"`: A built-in wide-angle camera. (focal length between 24mm and 35mm)
 * * `"telephoto-camera"`: A built-in camera device with a longer focal length than a wide-angle camera. (focal length between above 85mm)
 */
export type PhysicalCameraDeviceType = 'ultra-wide-angle-camera' | 'wide-angle-camera' | 'telephoto-camera';

/**
 * Indentifiers for a logical camera (Combinations of multiple physical cameras to create a single logical camera).
 *
 * * `"dual-camera"`: A combination of wide-angle and telephoto cameras that creates a capture device.
 * * `"dual-wide-camera"`: A device that consists of two cameras of fixed focal length, one ultrawide angle and one wide angle.
 * * `"triple-camera"`: A device that consists of three cameras of fixed focal length, one ultrawide angle, one wide angle, and one telephoto.
 */
export type LogicalCameraDeviceType = 'dual-camera' | 'dual-wide-camera' | 'triple-camera';

/**
 * Parses an array of physical device types into a single {@linkcode PhysicalCameraDeviceType} or {@linkcode LogicalCameraDeviceType}, depending what matches.
 * @method
 */
export const parsePhysicalDeviceTypes = (physicalDeviceTypes: PhysicalCameraDeviceType[]): PhysicalCameraDeviceType | LogicalCameraDeviceType => {
  if (physicalDeviceTypes.length === 1) {
    // @ts-expect-error for very obvious reasons
    return physicalDeviceTypes[0];
  }

  const hasWide = physicalDeviceTypes.includes('wide-angle-camera');
  const hasUltra = physicalDeviceTypes.includes('ultra-wide-angle-camera');
  const hasTele = physicalDeviceTypes.includes('telephoto-camera');
  if (hasTele && hasWide && hasUltra) return 'triple-camera';

  if (hasWide && hasUltra) return 'dual-wide-camera';

  if (hasWide && hasTele) return 'dual-camera';

  throw new Error(`Invalid physical device type combination! ${physicalDeviceTypes.join(' + ')}`);
};

/**
 * Indicates a format's color space.
 *
 * #### The following colorspaces are available on iOS:
 * * `"srgb"`: The sGRB color space (https://www.w3.org/Graphics/Color/srgb)
 * * `"p3-d65"`: The P3 D65 wide color space which uses Illuminant D65 as the white point
 * * `"hlg-bt2020"`: The BT2020 wide color space which uses Illuminant D65 as the white point and Hybrid Log-Gamma as the transfer function
 *
 * #### The following colorspaces are available on Android:
 * * `"yuv"`: The YCbCr color space.
 */
export type ColorSpace = 'hlg-bt2020' | 'p3-d65' | 'srgb' | 'yuv';

/**
 * Indicates a format's autofocus system.
 *
 * * `"none"`: Indicates that autofocus is not available
 * * `"contrast-detection"`: Indicates that autofocus is achieved by contrast detection. Contrast detection performs a focus scan to find the optimal position
 * * `"phase-detection"`: Indicates that autofocus is achieved by phase detection. Phase detection has the ability to achieve focus in many cases without a focus scan. Phase detection autofocus is typically less visually intrusive than contrast detection autofocus
 */
export type AutoFocusSystem = 'contrast-detection' | 'phase-detection' | 'none';

/**
 * Indicates a format's supported video stabilization mode
 *
 * * `"off"`: Indicates that video should not be stabilized
 * * `"standard"`: Indicates that video should be stabilized using the standard video stabilization algorithm introduced with iOS 5.0. Standard video stabilization has a reduced field of view. Enabling video stabilization may introduce additional latency into the video capture pipeline
 * * `"cinematic"`: Indicates that video should be stabilized using the cinematic stabilization algorithm for more dramatic results. Cinematic video stabilization has a reduced field of view compared to standard video stabilization. Enabling cinematic video stabilization introduces much more latency into the video capture pipeline than standard video stabilization and consumes significantly more system memory. Use narrow or identical min and max frame durations in conjunction with this mode
 * * `"cinematic-extended"`: Indicates that the video should be stabilized using the extended cinematic stabilization algorithm. Enabling extended cinematic stabilization introduces longer latency into the video capture pipeline compared to the AVCaptureVideoStabilizationModeCinematic and consumes more memory, but yields improved stability. It is recommended to use identical or similar min and max frame durations in conjunction with this mode (iOS 13.0+)
 * * `"auto"`: Indicates that the most appropriate video stabilization mode for the device and format should be chosen automatically
 */
export type VideoStabilizationMode = 'off' | 'standard' | 'cinematic' | 'cinematic-extended' | 'auto';

export interface FrameRateRange {
  minFrameRate: number;
  maxFrameRate: number;
}

/**
 * A Camera Device's video format. Do not create instances of this type yourself, only use {@linkcode Camera.getAvailableCameraDevices | Camera.getAvailableCameraDevices()}.
 */
export interface CameraDeviceFormat {
  /**
   * The height of the highest resolution a still image (photo) can be produced in
   */
  photoHeight: number;
  /**
   * The width of the highest resolution a still image (photo) can be produced in
   */
  photoWidth: number;
  /**
   * The video resolutions's height
   *
   * @platform iOS 13.0
   */
  videoHeight?: number;
  /**
   * The video resolution's width
   *
   * @platform iOS 13.0
   */
  videoWidth?: number;
  /**
   * A boolean value specifying whether this format supports the highest possible photo quality that can be delivered on the current platform.
   *
   * @platform iOS 13.0+
   */
  isHighestPhotoQualitySupported?: boolean;
  /**
   * Maximum supported ISO value
   */
  maxISO: number;
  /**
   * Minimum supported ISO value
   */
  minISO: number;
  /**
   * The video field of view in degrees
   */
  fieldOfView: number;
  /**
   * The maximum zoom factor
   */
  maxZoom: number;
  /**
   * The available color spaces.
   *
   * Note: On Android, this will always be only `["yuv"]`
   */
  colorSpaces: ColorSpace[];
  /**
   * Specifies whether this format supports HDR mode for video capture
   */
  supportsVideoHDR: boolean;
  /**
   * Specifies whether this format supports HDR mode for photo capture
   */
  supportsPhotoHDR: boolean;
  /**
   * All available frame rate ranges. You can query this to find the highest frame rate available
   */
  frameRateRanges: FrameRateRange[];
  /**
   * Specifies this format's auto focus system.
   */
  autoFocusSystem: AutoFocusSystem;
  /**
   * All supported video stabilization modes
   */
  videoStabilizationModes: VideoStabilizationMode[];
}

/**
 * Represents a camera device discovered by the {@linkcode Camera.getAvailableCameraDevices | Camera.getAvailableCameraDevices()} function
 */
export interface CameraDevice {
  /**
   * The native ID of the camera device instance.
   */
  id: string;
  /**
   * The physical devices this `CameraDevice` contains.
   *
   * * If this camera device is a **logical camera** (combination of multiple physical cameras), there are multiple cameras in this array.
   * * If this camera device is a **physical camera**, there is only a single element in this array.
   *
   * You can check if the camera is a logical multi-camera by using the `isMultiCam` property.
   */
  devices: PhysicalCameraDeviceType[];
  /**
   * Specifies the physical position of this camera. (back or front)
   */
  position: CameraPosition;
  /**
   * A friendly localized name describing the camera.
   */
  name: string;
  /**
   * Specifies whether this camera supports enabling flash for photo capture.
   */
  hasFlash: boolean;
  /**
   * Specifies whether this camera supports continuously enabling the flash to act like a torch (flash with video capture)
   */
  hasTorch: boolean;
  /**
   * A property indicating whether the receiver is a logical camera consisting of multiple physical cameras.
   *
   * Examples:
   * * The Dual Camera, which supports seamlessly switching between a wide and telephoto camera while zooming and generating depth data from the disparities between the different points of view of the physical cameras.
   * * The TrueDepth Camera, which generates depth data from disparities between a YUV camera and an Infrared camera pointed in the same direction.
   */
  isMultiCam: boolean;
  /**
   * Minimum available zoom factor
   */
  minZoom: number;
  /**
   * Maximum available zoom factor
   */
  maxZoom: number;
  /**
   * The zoom percentage (`0.0`-`1.0`) where the camera is "neutral".
   *
   * * For single-physical cameras this property is always `0.0`.
   * * For multi cameras this property is a value between `0.0` and `1.0`, where the camera is in wide-angle mode and hasn't switched to the ultra-wide (`0.5`x zoom) or telephoto camera yet.
   *
   * Use this value as an initial value for the zoom property if you implement custom zoom. (e.g. reanimated shared value should be initially set to this value)
   */
  neutralZoom: number;
  /**
   * All available formats for this camera device. Use this to find the best format for your use case and set it to the Camera's {@linkcode Camera.format} property.
   *
   * See [the Camera Formats documentation](https://cuvent.github.io/react-native-vision-camera/docs/formats) for more information about Camera Formats.
   */
  formats: CameraDeviceFormat[];
  /**
   * Whether this camera device supports low light boost.
   */
  supportsLowLightBoost: boolean;

  // TODO: supportsDepthCapture
  // /**
  //  * Whether this camera supports taking photos with depth data
  //  */
  // supportsDepthCapture: boolean;
  // TODO: supportsRawCapture
  // /**
  //  * Whether this camera supports taking photos in RAW format
  //  */
  // supportsRawCapture: boolean;
}
