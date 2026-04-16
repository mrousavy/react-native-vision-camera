import type { Location } from 'react-native-vision-camera'
import { locationFactory } from './locationFactory'

/**
 * Creates a new fake {@linkcode Location}.
 *
 * You can use this API to generate a {@linkcode Location}
 * object for use in EXIF data or video metadata, if you already
 * have a known {@linkcode latitude} or {@linkcode longitude} from
 * a different API or a hardcoded fake location.
 */
export function createLocation(latitude: number, longitude: number): Location {
  return locationFactory.createLocation(latitude, longitude)
}
