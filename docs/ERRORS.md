<table>
<tr>
<th><a href="../README.md">README</a></th>
<th><a href="./DEVICES.md">DEVICES</a></th>
<th><a href="./FORMATS.md">FORMATS</a></th>
<th><a href="./FRAME_PROCESSORS.md">FRAME_PROCESSORS</a></th>
<th><a href="./ANIMATED.md">ANIMATED</a></th>
<th>ERRORS</th>
</tr>
</table>

<br/>
<br/>

<h1 align="center">Errors</h1>

<div>
  <img align="right" width="35%" src="../img/example_error.png">
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

## The Error types

### `CameraError`

The `CameraError` type is a baseclass type for all other errors, and should only be used internally. It, and therefore all other error classes, provide the following properties:

* `code`: A typed code in the form of `{domain}/{code}` that can be used to quickly identify and group errors
* `message`: A non-localized message text that provides a more information and context about the error and possibly problematic values.
* (optional) `cause`: An `ErrorWithCause` instance that provides information about the cause of the error.
  * `cause.message`: The message of the error that caused the camera error. This is localized on iOS.
  * (iOS) `cause.details`: More dictionary-style information about the cause. (iOS only)
  * (Android) `cause.stacktrace`: A native Java stacktrace for the cause.
  * (optional) `cause.cause`: The cause that caused the given error. (Recursive)

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
          case "file-io-error":
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
