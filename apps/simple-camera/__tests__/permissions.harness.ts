import { describe, expect, it } from 'react-native-harness'
import { VisionCamera } from 'react-native-vision-camera'

describe('VisionCamera - Permissions', () => {
  it('reports camera permission as authorized', () => {
    expect(VisionCamera.cameraPermissionStatus).toBe('authorized')
  })

  it('reports microphone permission as authorized', () => {
    expect(VisionCamera.microphonePermissionStatus).toBe('authorized')
  })

  it('resolves requestCameraPermission to true when already authorized', async () => {
    expect(VisionCamera.cameraPermissionStatus).toBe('authorized')

    const wasGranted = await VisionCamera.requestCameraPermission()

    expect(wasGranted).toBe(true)
  })

  it('resolves requestMicrophonePermission to true when already authorized', async () => {
    expect(VisionCamera.microphonePermissionStatus).toBe('authorized')

    const wasGranted = await VisionCamera.requestMicrophonePermission()

    expect(wasGranted).toBe(true)
  })
})
