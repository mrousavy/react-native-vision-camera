import type { HybridObject } from 'react-native-nitro-modules'
import type { CameraOrientation } from '../common-types/CameraOrientation'
import type { OrientationSource } from '../common-types/OrientationSource'

/**
 * The {@linkcode OrientationManager} allows listening to
 * {@linkcode CameraOrientation} changes, like device- or interface-
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
   * Get the current {@linkcode CameraOrientation}, or `undefined` if no
   * orientation is known.
   */
  readonly currentOrientation: CameraOrientation | undefined
  /**
   * Starts listening to orientation changes.
   */
  startOrientationUpdates(
    onChanged: (orientation: CameraOrientation) => void,
  ): void
  /**
   * Stops listening to orientation changes.
   */
  stopOrientationUpdates(): void
}
