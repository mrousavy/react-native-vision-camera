import type { CameraDevice } from '../inputs/CameraDevice.nitro'

/**
 * Represents the type of a physical or logical Camera lens on the {@linkcode CameraDevice}.
 *
 * Physical Cameras are single hardware lenses:
 * - `'wide-angle'`: The default Camera, with a wide field of view.
 * - `'ultra-wide-angle'`: A very wide-angle lens, typically capturing a much larger field of view.
 * - `'telephoto'`: A lens with a longer focal length, used for optical zoom.
 * - `'continuity'`: An external Continuity Camera (iPhone used as a Camera on macOS).
 * - `'lidar-depth'`: A LiDAR-based depth sensor.
 * - `'true-depth'`: A structured-light based depth sensor (such as the FaceID front Camera).
 * - `'time-of-flight-depth'`: A time-of-flight based depth sensor.
 * - `'external'`: A generic external Camera (e.g. USB).
 * - `'unknown'`: The Camera type is unknown or not reported.
 *
 * Logical Cameras are virtual Cameras that combine multiple physical Cameras into one:
 * - `'dual'`: A logical combination of a wide-angle and a telephoto lens.
 * - `'dual-wide'`: A logical combination of a wide-angle and an ultra-wide-angle lens.
 * - `'triple'`: A logical combination of three physical Cameras (typically ultra-wide, wide, and telephoto).
 * - `'quad'`: A logical combination of four physical Cameras.
 *
 * @see {@linkcode CameraDevice.physicalDevices}
 */
export type DeviceType =
  | 'wide-angle'
  | 'ultra-wide-angle'
  | 'telephoto'
  | 'dual'
  | 'dual-wide'
  | 'triple'
  | 'quad'
  | 'continuity'
  | 'lidar-depth'
  | 'true-depth'
  | 'time-of-flight-depth'
  | 'external'
  | 'unknown'
