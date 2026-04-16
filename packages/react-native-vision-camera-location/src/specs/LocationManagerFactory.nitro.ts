import type { HybridObject } from 'react-native-nitro-modules'
import type { Location } from 'react-native-vision-camera'
import type { LocationAccuracy } from './LocationAccuracy'
import type { LocationManager } from './LocationManager.nitro'

export interface LocationManagerOptions {
  /**
   * Configures the accuracy of location updates.
   * @default 'balanced'
   */
  accuracy: LocationAccuracy
  /**
   * Configures the distance the last location has to
   * change in order to fire a new location update event,
   * in meters.
   * @default 10
   */
  distanceFilter: number
  /**
   * Specify the interval in which location updates
   * should be requested from the system, in milliseconds.
   * @platform Android
   * @default 10000
   */
  updateInterval: number
}

export interface LocationManagerFactory
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
  /**
   * Create a new {@linkcode LocationManager}
   * with the given {@linkcode LocationManagerOptions}
   */
  createLocationManager(options: LocationManagerOptions): LocationManager

  /**
   * Creates a new fake {@linkcode Location}.
   *
   * You can use this API to generate a {@linkcode Location}
   * object for use in EXIF data or video metadata, if you already
   * have a known {@linkcode latitude} or {@linkcode longitude} from
   * a different API or a hardcoded fake location.
   */
  createLocation(latitude: number, longitude: number): Location
}
