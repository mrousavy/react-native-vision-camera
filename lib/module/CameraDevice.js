/**
 * Indentifiers for a physical camera (one that actually exists on the back/front of the device)
 *
 * * `"ultra-wide-angle-camera"`: A built-in camera with a shorter focal length than that of a wide-angle camera. (focal length between below 24mm)
 * * `"wide-angle-camera"`: A built-in wide-angle camera. (focal length between 24mm and 35mm)
 * * `"telephoto-camera"`: A built-in camera device with a longer focal length than a wide-angle camera. (focal length between above 85mm)
 */

/**
 * Indentifiers for a logical camera (Combinations of multiple physical cameras to create a single logical camera).
 *
 * * `"dual-camera"`: A combination of wide-angle and telephoto cameras that creates a capture device.
 * * `"dual-wide-camera"`: A device that consists of two cameras of fixed focal length, one ultrawide angle and one wide angle.
 * * `"triple-camera"`: A device that consists of three cameras of fixed focal length, one ultrawide angle, one wide angle, and one telephoto.
 */

/**
 * Parses an array of physical device types into a single {@linkcode PhysicalCameraDeviceType} or {@linkcode LogicalCameraDeviceType}, depending what matches.
 * @method
 */
export const parsePhysicalDeviceTypes = physicalDeviceTypes => {
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
 * * `"srgb"`: The sGRB color space.
 * * `"p3-d65"`: The P3 D65 wide color space which uses Illuminant D65 as the white point
 * * `"hlg-bt2020"`: The BT2020 wide color space which uses Illuminant D65 as the white point and Hybrid Log-Gamma as the transfer function
 *
 * > See ["AVCaptureColorSpace"](https://developer.apple.com/documentation/avfoundation/avcapturecolorspace) for more information.
 *
 * #### The following colorspaces are available on Android:
 * * `"yuv"`: The Multi-plane Android YCbCr color space. (YUV 420_888, 422_888 or 444_888)
 * * `"jpeg"`: The compressed JPEG color space.
 * * `"jpeg-depth"`: The compressed JPEG color space including depth data.
 * * `"raw"`: The Camera's RAW sensor color space. (Single-channel Bayer-mosaic image, usually 16 bit)
 * * `"heic"`: The compressed HEIC color space.
 * * `"private"`: The Android private opaque image format. (The choices of the actual format and pixel data layout are entirely up to the device-specific and framework internal implementations, and may vary depending on use cases even for the same device. These buffers are not directly accessible to the application)
 * * `"depth-16"`: The Android dense depth image format (16 bit)
 * * `"unknown"`: Placeholder for an unknown image/pixel format. [Edit this file](https://github.com/mrousavy/react-native-vision-camera/edit/main/android/src/main/java/com/mrousavy/camera/parsers/ImageFormat+String.kt) to add a name for the unknown format.
 *
 * > See ["Android Color Formats"](https://jbit.net/Android_Colors/) for more information.
 */
//# sourceMappingURL=CameraDevice.js.map