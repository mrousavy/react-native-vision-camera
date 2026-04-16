/**
 * Represents the target mirroring setting for a Camera Output.
 * - `'on'`: Mirrors the Camera, e.g. for front Cameras.
 * - `'off'`: Doesn't mirror anything.
 * - `'auto'`: Automatically mirrors the Camera if the platform recommends it, such as for front Cameras.
 */
export type MirrorMode = 'on' | 'off' | 'auto'
