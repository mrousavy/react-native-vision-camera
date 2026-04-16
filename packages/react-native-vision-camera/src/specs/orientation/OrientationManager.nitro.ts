import type { HybridObject } from 'react-native-nitro-modules'
import type { Orientation } from '../common-types/Orientation'
import type { OrientationSource } from '../common-types/OrientationSource'

/**
 * The {@linkcode OrientationManager} allows listening to
 * {@linkcode Orientation} changes, like device- or interface-
 * orientation.
 */
export interface OrientationManager
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
  /**
   * Represents the {@linkcode OrientationSource} this {@linkcode OrientationManager}
   * is tracking.
   */
  readonly source: OrientationSource
  /**
   * Get the current {@linkcode Orientation}, or `undefined` if no
   * orientation is known.
   */
  readonly currentOrientation: Orientation | undefined
  /**
   * Starts listening to orientation changes.
   */
  startOrientationUpdates(onChanged: (orientation: Orientation) => void): void
  /**
   * Stops listening to orientation changes.
   */
  stopOrientationUpdates(): void
}
