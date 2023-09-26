/**
 * Represents Orientation. Depending on the context, this might be a sensor
 * orientation (relative to the phone's orentation), or view orientation.
 *
 * - `portrait`: **0°** (home-button at the bottom)
 * - `landscape-left`: **90°** (home-button on the left)
 * - `portrait-upside-down`: **180°** (home-button at the top)
 * - `landscape-right`: **270°** (home-button on the right)
 */
export type Orientation = 'portrait' | 'portrait-upside-down' | 'landscape-left' | 'landscape-right'
