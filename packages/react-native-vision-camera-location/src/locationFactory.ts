import { NitroModules } from 'react-native-nitro-modules'
import type { LocationManagerFactory } from './specs/LocationManagerFactory.nitro'

/**
 * The underlying native {@linkcode LocationManagerFactory} that creates
 * {@linkcode LocationManager} and {@linkcode Location} instances.
 *
 * Most users should use the higher-level {@linkcode createLocationManager}
 * or {@linkcode useLocationManager} APIs instead.
 */
export const locationFactory =
  NitroModules.createHybridObject<LocationManagerFactory>(
    'LocationManagerFactory',
  )
