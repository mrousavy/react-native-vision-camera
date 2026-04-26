/**
 * Specifies how a video recording should be encoded when using a high-speed capture session.
 *
 * - `'high-speed'`: Records and saves the video at the negotiated high frame-rate (for example 120 FPS).
 * - `'slow-motion'`: Records at a negotiated high frame-rate, then saves the file at a standard playback frame-rate to create a slow-motion effect.
 *
 * @platform Android
 */
export type VideoRecordingMode = 'high-speed' | 'slow-motion'
