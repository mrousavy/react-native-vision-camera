/**
 * Represents the status of a Permission - e.g. Camera or Microphone.
 * - `'not-determined'`: The app may request permission right now.
 *   On iOS this means the permission has never been requested yet.
 *   On Android this can also mean the user denied once, but did not select "don't ask again".
 * - `'authorized'`: The app is authorized to use said permission and can proceed.
 * - `'denied'`: The permission has been requested previously, but has been denied by the user. The app can not proceed with using the service. To authorize the permission, your app must prompt the user to open settings and explicitly grant permission.
 * - `'restricted'`: The permission has been restricted, e.g. via parenting controls and can not be requested.
 *
 * @discussion
 * You can only request permission if the status is `'not-determined'`.
 */
export type PermissionStatus =
  | 'not-determined'
  | 'authorized'
  | 'denied'
  | 'restricted'
