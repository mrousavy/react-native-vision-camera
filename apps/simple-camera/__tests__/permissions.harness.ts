import { describe, expect, it } from 'react-native-harness'
import { VisionCamera } from 'react-native-vision-camera'

const VALID_PERMISSION_STATUSES = [
  'not-determined',
  'authorized',
  'denied',
  'restricted',
] as const

describe('VisionCamera - Permissions', () => {
  it('exposes a valid camera permission status', () => {
    const status = VisionCamera.cameraPermissionStatus

    expect(VALID_PERMISSION_STATUSES).toContain(status)
  })

  it('exposes a valid microphone permission status', () => {
    const status = VisionCamera.microphonePermissionStatus

    expect(VALID_PERMISSION_STATUSES).toContain(status)
  })

  it('returns a consistent camera permission status across reads', () => {
    const firstRead = VisionCamera.cameraPermissionStatus
    const secondRead = VisionCamera.cameraPermissionStatus

    expect(firstRead).toBe(secondRead)
  })

  it('returns a consistent microphone permission status across reads', () => {
    const firstRead = VisionCamera.microphonePermissionStatus
    const secondRead = VisionCamera.microphonePermissionStatus

    expect(firstRead).toBe(secondRead)
  })

  it('resolves requestCameraPermission to true when already authorized', async () => {
    if (VisionCamera.cameraPermissionStatus !== 'authorized') {
      console.log(
        '[SKIP] requestCameraPermission: permission is not pre-authorized, skipping to avoid blocking on the native system dialog',
      )
      return
    }

    const wasGranted = await VisionCamera.requestCameraPermission()

    expect(wasGranted).toBe(true)
    expect(VisionCamera.cameraPermissionStatus).toBe('authorized')
  })

  it('resolves requestMicrophonePermission to true when already authorized', async () => {
    if (VisionCamera.microphonePermissionStatus !== 'authorized') {
      console.log(
        '[SKIP] requestMicrophonePermission: permission is not pre-authorized, skipping to avoid blocking on the native system dialog',
      )
      return
    }

    const wasGranted = await VisionCamera.requestMicrophonePermission()

    expect(wasGranted).toBe(true)
    expect(VisionCamera.microphonePermissionStatus).toBe('authorized')
  })
})
