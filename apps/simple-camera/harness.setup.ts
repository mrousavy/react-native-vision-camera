import { beforeAll } from 'react-native-harness'
import { VisionCamera } from 'react-native-vision-camera'

// On the AWS Device Farm the prompt is auto-granted, so kicking the request off
// here is enough to flip the status to 'authorized' before any test runs.
beforeAll(async () => {
  await VisionCamera.requestCameraPermission()
  await VisionCamera.requestMicrophonePermission()
})
