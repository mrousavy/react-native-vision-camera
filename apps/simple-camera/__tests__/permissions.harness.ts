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
    expect(VALID_PERMISSION_STATUSES).toContain(
      VisionCamera.cameraPermissionStatus,
    )
  })

  it('exposes a valid microphone permission status', () => {
    expect(VALID_PERMISSION_STATUSES).toContain(
      VisionCamera.microphonePermissionStatus,
    )
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

  it('grants camera permission when requested', async () => {
    const wasGranted = await VisionCamera.requestCameraPermission()

    expect(wasGranted).toBe(true)
    expect(VisionCamera.cameraPermissionStatus).toBe('authorized')
  })

  it('grants microphone permission when requested', async () => {
    const wasGranted = await VisionCamera.requestMicrophonePermission()

    expect(wasGranted).toBe(true)
    expect(VisionCamera.microphonePermissionStatus).toBe('authorized')
  })
})
