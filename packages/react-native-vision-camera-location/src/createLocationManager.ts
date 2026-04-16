import { locationFactory } from './locationFactory'
import type { LocationManager } from './specs/LocationManager.nitro'
import type { LocationManagerOptions } from './specs/LocationManagerFactory.nitro'

/**
 * Create a new {@linkcode LocationManager}
 * with the given {@linkcode LocationManagerOptions}
 */
export function createLocationManager(
  options: LocationManagerOptions,
): LocationManager {
  return locationFactory.createLocationManager(options)
}
