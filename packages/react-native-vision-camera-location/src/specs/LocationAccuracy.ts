import type { Location } from 'react-native-vision-camera'

/**
 * The accuracy of a {@linkcode Location}.
 * - `'high'`: Typically ~3-10m accuracy. Uses GPS + WiFi + cell + sensors.
 * - `'balanced'`: Typically ~10-50m accuracy. Uses WiFi + cell.
 * - `'low'`: Typically ~ 100-1000m accuracy. Uses cell.
 */
export type LocationAccuracy = 'high' | 'balanced' | 'low'
