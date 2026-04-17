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

  it('requests camera permission and returns a boolean result', async () => {
    const status = VisionCamera.cameraPermissionStatus

    if (status === 'denied' || status === 'restricted') {
      console.log(
        `[SKIP] camera permission request: status is '${status}', cannot be requested programmatically`,
      )
      return
    }

    const wasGranted = await VisionCamera.requestCameraPermission()

    expect(typeof wasGranted).toBe('boolean')
    if (wasGranted) {
      expect(VisionCamera.cameraPermissionStatus).toBe('authorized')
    }
  })

  it('requests microphone permission and returns a boolean result', async () => {
    const status = VisionCamera.microphonePermissionStatus

    if (status === 'denied' || status === 'restricted') {
      console.log(
        `[SKIP] microphone permission request: status is '${status}', cannot be requested programmatically`,
      )
      return
    }

    const wasGranted = await VisionCamera.requestMicrophonePermission()

    expect(typeof wasGranted).toBe('boolean')
    if (wasGranted) {
      expect(VisionCamera.microphonePermissionStatus).toBe('authorized')
    }
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
})
