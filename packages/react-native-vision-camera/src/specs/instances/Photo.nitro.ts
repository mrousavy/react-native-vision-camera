import type { Image } from 'react-native-nitro-image'
import type { HybridObject } from 'react-native-nitro-modules'
import type { Orientation } from '../common-types/Orientation'
import type { PhotoContainerFormat } from '../common-types/PhotoContainerFormat'
import type {
  CameraPhotoOutput,
  CapturePhotoSettings,
} from '../outputs/CameraPhotoOutput.nitro'
import type { CameraCalibrationData } from './CameraCalibrationData.nitro'
import type { Depth } from './Depth.nitro'

/**
 * Represents a captured {@linkcode Photo} in-memory.
 *
 * {@linkcode Photo | Photos} can be captured with
 * a {@linkcode CameraPhotoOutput}, and can be saved
 * to a file using {@linkcode Photo.saveToTemporaryFileAsync | saveToTemporaryFileAsync()}.
 *
 * To display the photo to the user, use
 * {@linkcode Photo.toImageAsync | toImageAsync()}, then
 * display that using `react-native-nitro-image`'s
 * `<NitroImage />` component.
 *
 * @example
 * Display the Photo to the user using `react-native-nitro-image`:
 * ```tsx
 * const photoOutput = ...
 * const [image, setImage] = useState<Image>()
 *
 * const takePhoto = async () => {
 *   const photo = await photoOutput.capturePhoto({}, {})
 *   const img = await photo.toImageAsync()
 *   setImage(img)
 * }
 *
 * return <NitroImage style={{ flex: 1 }} image={image} />
 * ```
 * @example
 * Save the photo to a temporary file:
 * ```ts
 * const photoOutput = ...
 *
 * const takePhoto = async () => {
 *   const photo = await photoOutput.capturePhoto({}, {})
 *   const image = await photo.toImageAsync()
 * }
 * ```
 * @example
 * Convert the Photo to a Skia Image:
 * ```ts
 * const photoOutput = ...
 * const photo = await photoOutput.capturePhoto({}, {})
 * const encodedData = await photo.getFileDataAsync()
 * const bytes = new Uint8Array(encodedData)
 * const data = Skia.Data.fromBytes(bytes)
 * const skiaImage = Skia.Image.MakeImageFromEncoded(data)
 * ```
 */
export interface Photo
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
  /**
   * Gets whether this {@linkcode Photo} is mirrored alongside the
   * vertical axis.
   */
  readonly isMirrored: boolean
  /**
   * Gets the {@linkcode Orientation} this {@linkcode Photo} was
   * captured in.
   *
   * {@linkcode Orientation} will be applied lazily via EXIF
   * flags, or when converting the {@linkcode Photo} to an
   * {@linkcode Image}.
   */
  readonly orientation: Orientation
  /**
   * Represents the timestamp this {@linkcode Photo} was
   * captured at, using the system's host clock, in seconds.
   */
  readonly timestamp: number
  /**
   * Gets whether this {@linkcode Photo} is a RAW photo (i.e.
   * no processing has been applied), or a processed photo (e.g.
   * JPEG).
   * @see {@linkcode containerFormat}
   */
  readonly isRawPhoto: boolean
  /**
   * Get the width of this {@linkcode Photo}, in pixels.
   */
  readonly width: number
  /**
   * Get the height of this {@linkcode Photo}, in pixels.
   */
  readonly height: number
  /**
   * Get the {@linkcode PhotoContainerFormat} of
   * this {@linkcode Photo}.
   */
  readonly containerFormat: PhotoContainerFormat

  // TODO: Expose EXIF Metadata
  // readonly exifMetadata: AnyMap

  /**
   * Get whether this {@linkcode Photo} has
   * a native pixel buffer attached to it,
   * which allows reading its pixels from JS.
   * @see {@linkcode getPixelBuffer | getPixelBuffer()}
   */
  readonly hasPixelBuffer: boolean
  /**
   * Get the {@linkcode Photo}'s native pixel
   * buffer. This allows readonly access
   * to the individual pixels.
   *
   * This does not contain any EXIF data.
   * @throws If {@linkcode hasPixelBuffer} is false.
   */
  getPixelBuffer(): ArrayBuffer

  /**
   * Get the associated {@linkcode Depth} data
   * for this {@linkcode Photo} if it has one.
   * @see {@linkcode CapturePhotoSettings.enableDepthData}
   */
  readonly depth?: Depth

  /**
   * Get the associated {@linkcode CameraCalibrationData}
   * for this {@linkcode Photo} if calibration data delivery
   * was enabled.
   *
   * @see {@linkcode CapturePhotoSettings.enableCameraCalibrationDataDelivery}
   * @platform iOS
   */
  readonly calibrationData?: CameraCalibrationData

  /**
   * Asynchronously saves this {@linkcode Photo} to
   * a file at the given {@linkcode path}, using this
   * {@linkcode containerFormat}.
   *
   * @param path The path to save the Image to.
   * Must contain a full path name including filename
   * and extension. All parent directories must exist,
   * but the file itself must not exist.
   */
  saveToFileAsync(path: string): Promise<void>
  /**
   * Asynchronously saves this {@linkcode Photo} to
   * a temporary file using this {@linkcode containerFormat},
   * and returns the path it was saved at.
   */
  saveToTemporaryFileAsync(): Promise<string>
  /**
   * Gets the raw file data of the {@linkcode Photo} after
   * processing and including EXIF flags.
   */
  getFileData(): ArrayBuffer
  /**
   * Asynchronously ets the raw file data of
   * the {@linkcode Photo} after processing
   * and including EXIF flags.
   */
  getFileDataAsync(): Promise<ArrayBuffer>

  /**
   * Converts this {@linkcode Photo} to an {@linkcode Image},
   * possibly applying {@linkcode orientation} and {@linkcode isMirrored}
   * settings.
   * @throws If the {@linkcode Photo} is a raw photo (see {@linkcode isRawPhoto})
   * @throws If the {@linkcode Photo}'s Image data cannot be accessed
   */
  toImage(): Image
  /**
   * Asynchronously converts this {@linkcode Photo} to an {@linkcode Image},
   * possibly applying {@linkcode orientation} and {@linkcode isMirrored}
   * settings.
   * @throws If the {@linkcode Photo} is a raw photo (see {@linkcode isRawPhoto})
   * @throws If the {@linkcode Photo}'s Image data cannot be accessed
   */
  toImageAsync(): Promise<Image>
}
