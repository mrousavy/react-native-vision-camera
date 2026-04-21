/**
 * Represents the orientation, relative to a base anchor.
 * - `'up'`: The default orientation relative to your base anchor. aka no rotation at all.
 * - `'down'`: Inverted upside down relative to your base anchor. Whatever was "top" before is now "bottom", whatever was "bottom" before is now "top".
 * - `'left'`: Rotated 90° left. Whatever was "top" before is now "left", whatever was bottom before is now "right".
 * - `'right'`: Rotated 90° right. Whatever was "top" before is now "right", whatever was bottom before is now "left".
 */
export type CameraOrientation = 'up' | 'right' | 'down' | 'left'
