---
id: errors
title: Camera Errors
sidebar_label: Camera Errors
---

<div>
  <img align="right" width="35%" src="../static/img/example_error.png" />
</div>

## Why?

Since the Camera library is quite big, there is a lot that can "go wrong". The react-native-vision-camera library provides thoroughly typed errors to help you quickly identify the cause and fix the problem.

```ts
switch (error.code) {
  case "device/configuration-error":
    console.log("Failed to configure the camera device.")
    break
  case "device/microphone-unavailable":
    console.log("This camera device does not have a microphone.")
    break
  case "capture/recording-in-progress":
    console.log("Another recording is already in progress!")
    break
  default:
    console.error(error)
    break
}
```

## Troubleshooting

See [Troubleshooting](troubleshooting) if you're having "weird issues".

## The Error types

The `CameraError` type is a baseclass type for all other errors and provides the following properties:

* `code`: A typed code in the form of `{domain}/{code}` that can be used to quickly identify and group errors
* `message`: A non-localized message text that provides a more information and context about the error and possibly problematic values.
* `cause?`: An `ErrorWithCause` instance that provides information about the cause of the error. (Optional)
  * `cause.message`: The message of the error that caused the camera error. This is localized on iOS.
  * `cause.code?`: The native error's error-code. (iOS only)
  * `cause.domain?`: The native error's domain. (iOS only)
  * `cause.details?`: More dictionary-style information about the cause. (iOS only)
  * `cause.stacktrace?`: A native Java stacktrace for the cause. (Android only)
  * `cause.cause?`: The cause that caused this cause. (Recursive) (Optional)

### Runtime Errors

The `CameraRuntimeError` represents any kind of error that occured while mounting the Camera view, or an error that occured during the runtime.

The `<Camera />` UI Component provides an `onError` function that will be invoked every time an unexpected runtime error occured.

```tsx
function App() {
  const onError = useCallback((error: CameraRuntimeError) => {
    console.error(error)
  }, [])

  return <Camera ref={camera} {...cameraProps} />
}
```

### Capture Errors

The `CameraCaptureError` represents any kind of error that occured only while capturing a photo or recording a video.

```tsx
function App() {
  const camera = useRef<Camera>(null)

  const onPress = useCallback(() => {
    try {
      const photo = await camera.current.takePhoto()
    } catch (e) {
      if (e instanceof CameraCaptureError) {
        switch (e.code) {
          case "capture/file-io-error":
            console.error("Failed to write photo to disk!")
            break
          default:
            console.error(e)
            break
        }
      }
    }
  }, [camera]);

  return <Camera ref={camera} {...cameraProps} />
}
```
