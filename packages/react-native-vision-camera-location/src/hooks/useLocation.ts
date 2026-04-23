import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import type { Location } from 'react-native-vision-camera'
import type { LocationManagerOptions } from '../specs/LocationManagerFactory.nitro'
import { useLocationManager } from './useLocationManager'

/**
 * The current state of the {@linkcode useLocation} hook.
 */
export interface LocationState {
  /**
   * Whether the app has been granted permission to access the user's location.
   *
   * If this is `false`, call {@linkcode requestPermission | requestPermission()}
   * to prompt the user.
   */
  hasPermission: boolean
  /**
   * Requests the location permission from the user.
   *
   * Resolves with whether the permission was granted after the request completed.
   */
  requestPermission(): Promise<boolean>
  /**
   * The last known user {@linkcode Location}, or `undefined` if no location has
   * been reported yet (e.g. because permission has not been granted, or because
   * the device is still acquiring a fix).
   */
  currentLocation: Location | undefined
}

/**
 * Reactively use the current user {@linkcode Location}.
 * @example
 * ```tsx
 * const location = useLocation()
 *
 * useEffect(() => {
 *   if (!location.hasPermission) {
 *     location.requestPermission()
 *   }
 * }, [location.hasPermission])
 *
 * if (location.hasPermission) {
 *   console.log(location.location)
 * }
 * ```
 */
export function useLocation(
  options?: Partial<LocationManagerOptions>,
): LocationState {
  const locationManager = useLocationManager(options)

  const [hasPermission, setHasPermission] = useState(
    () => locationManager.locationPermissionStatus === 'authorized',
  )

  useEffect(() => {
    setHasPermission(locationManager.locationPermissionStatus === 'authorized')
  }, [locationManager])

  const lastKnownLocation = useRef(locationManager.lastKnownLocation)
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const listener = locationManager.addOnLocationChangedListener(
        (newLocation) => {
          lastKnownLocation.current = newLocation
          onStoreChange()
        },
      )
      return () => listener.remove()
    },
    [locationManager],
  )
  const getSnapshot = useCallback(() => lastKnownLocation.current, [])
  const location = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  const requestPermission = useCallback(async () => {
    await locationManager.requestLocationPermission()
    const nowHasPermission =
      locationManager.locationPermissionStatus === 'authorized'
    setHasPermission(nowHasPermission)
    return nowHasPermission
  }, [locationManager])

  useEffect(() => {
    if (!hasPermission) {
      return
    }
    locationManager.startUpdating()
    return () => {
      locationManager.stopUpdating()
    }
  }, [hasPermission, locationManager])

  return {
    hasPermission: hasPermission,
    requestPermission: requestPermission,
    currentLocation: location,
  }
}
