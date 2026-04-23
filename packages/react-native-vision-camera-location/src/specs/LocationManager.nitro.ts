import type { HybridObject } from 'react-native-nitro-modules'
import type { Location, PermissionStatus } from 'react-native-vision-camera'
import type { createLocationManager } from '../createLocationManager'
import type { useLocation } from '../hooks/useLocation'
import type { useLocationManager } from '../hooks/useLocationManager'
import type { ListenerSubscription } from './ListenerSubscription'
import type { LocationAccuracy } from './LocationAccuracy'

/**
 * Streams device location updates and exposes the last known {@linkcode Location}.
 *
 * Create a {@linkcode LocationManager} via {@linkcode createLocationManager} or the
 * {@linkcode useLocationManager} hook. For a React-friendly API that handles
 * permissions and subscriptions automatically, use {@linkcode useLocation}.
 *
 * @see {@linkcode useLocation}
 * @see {@linkcode useLocationManager}
 * @see {@linkcode createLocationManager | createLocationManager(...)}
 */
export interface LocationManager
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
  /**
   * Get the last known {@linkcode Location}, or `undefined`
   * if no location is known.
   */
  readonly lastKnownLocation: Location | undefined
  /**
   * Get the current location permission status.
   *
   * The {@linkcode PermissionStatus} depends on this
   * {@linkcode LocationManager}'s configuration, as
   * properties like {@linkcode LocationAccuracy} affect
   * {@linkcode locationPermissionStatus}.
   */
  readonly locationPermissionStatus: PermissionStatus
  /**
   * Request location permission.
   */
  requestLocationPermission(): Promise<boolean>

  /**
   * Start updating location updates.
   * @throws If {@linkcode locationPermissionStatus} is not {@linkcode PermissionStatus | 'authorized'}.
   */
  startUpdating(): Promise<void>
  /**
   * Stop updating location updates.
   */
  stopUpdating(): Promise<void>

  /**
   * Adds a {@linkcode callback} to be called whenever the
   * current {@linkcode Location} changes.
   */
  addOnLocationChangedListener(
    callback: (location: Location) => void,
  ): ListenerSubscription
}
