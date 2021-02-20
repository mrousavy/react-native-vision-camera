/**
 * Represents the camera device position.
 *
 * * `"back"`: Indicates that the device is physically located on the back of the system hardware
 * * `"front"`: Indicates that the device is physically located on the front of the system hardware
 *
 * #### iOS only
 * * `"unspecified"`: Indicates that the device's position relative to the system hardware is unspecified
 *
 * #### Android only
 * * `"external"`: The camera device is an external camera, and has no fixed facing relative to the device's screen. (Android only)
 */
export type CameraPosition = 'front' | 'back' | 'unspecified' | 'external';
