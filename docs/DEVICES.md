<table>
<tr>
<th><a href="../README.md">README</a></th>
<th>DEVICES</th>
<th><a href="./FORMATS.md">FORMATS</a></th>
<th><a href="./FRAME_PROCESSORS.md">FRAME_PROCESSORS</a></th>
<th><a href="./ANIMATED.md">ANIMATED</a></th>
<th><a href="./ERRORS.md">ERRORS</a></th>
</tr>
</table>

<br/>

<h1 align="center">Devices</h1>

<div>
  <img align="right" width="35%" src="../img/ultra-wide-demo.gif">
</div>

### What are camera devices?

Camera devices are the physical (or "virtual") devices that can be used to record videos or capture photos.

* **Physical**: A physical camera device is a camera lens on your phone. Different physical camera devices have different specifications, such as different capture formats, field of views, focal lengths, and more. Some phones have multiple physical camera devices.

  > Examples: _"Backside Wide-Angle Camera"_, _"Frontside Wide-Angle Camera (FaceTime HD)"_, _"Ultra-Wide-Angle back camera"_.

* **Virtual**: A virtual camera device is a combination of multiple physical camera devices, and provides features such as _virtual-device-switchover_ while zooming, and _combined photo delivery_ from all physiscal cameras to produce higher quality images.

  > Examples: _"Triple-Camera"_, _"Dual-Wide-Angle Camera"_

### Get available camera devices

To get a list of all available camera devices, use the `getAvailableCameraDevices` function:

```ts
const devices = await Camera.getAvailableCameraDevices()
```

> [🔗 See the `CameraDevice` type](./../src/CameraDevice.ts)

A camera device (`CameraDevice`) contains a list of physical device types this camera device consists of.

Example:
* For a single Wide-Angle camera, this would be `["wide-angle-camera"]`
* For a Triple-Camera, this would be `["wide-angle-camera", "ultra-wide-angle-camera", "telephoto-camera"]`

You can use the helper function `parsePhysicalDeviceTypes` to convert a list of physical devices to a single device descriptor type which can also describe virtual devices:

```ts
console.log(device.devices)
//  --> ["wide-angle-camera", "ultra-wide-angle-camera", "telephoto-camera"]

const deviceType = parsePhysicalDeviceTypes(device.devices)
console.log(deviceType)
//  --> "triple-camera"
```

The `CameraDevice` type also contains other useful information describing a camera device, such as `position` ("front", "back", ...), `hasFlash`, it's `formats` (See [FORMATS.md](./FORMATS.md)), and more.

Make sure to carefully filter out unneeded camera devices, since not every phone supports all camera device types. Some phones don't even have front-cameras.

### `useCameraDevices` hook

The react-native-vision-camera library provides a hook to make camera device selection a lot easier.

You can specify a device type to only find devices with the given type:

```tsx
function App() {
  const devices = useCameraDevices('wide-angle-camera')
  const device = devices.back

  return (
    <Camera
      style={StyleSheet.absoluteFill}
      device={device}
    />
  )
}
```

Or just return the "best matching camera device". This function prefers camera devices with more physical cameras, and always ranks "wide-angle" physical camera devices first.

> Example: `triple-camera` > `dual-wide-camera` > `dual-camera` > `wide-angle-camera` > `ultra-wide-angle-camera` > `telephoto-camera` > ...

```tsx
function App() {
  const devices = useCameraDevices()
  const device = devices.back

  return (
    <Camera
      style={StyleSheet.absoluteFill}
      device={device}
    />
  )
}
```

### The `isActive` prop

The Camera's `isActive` property can be used to _pause_ the session (`isActive={false}`) while still keeping the session "warm". This is more desirable than completely unmounting the camera, since _resuming_ the session (`isActive={true}`) will be **much faster** than re-mounting the camera view.

For example, you want to **pause the camera** when the user **navigates to another page** or **minimizes the app** since otherwise the camera continues to run in the background without the user seeing it, causing **siginificant battery drain**. Also, on iOS a green dot indicates the user that the camera is still active, possibly causing the user to raise privacy concerns. (🔗 See ["About the orange and green indicators in your iPhone status bar"](https://support.apple.com/en-us/HT211876))

This example demonstrates how you could pause the camera stream once the app goes into background using a custom `useIsAppForeground` hook:

```tsx
function App() {
  const devices = useCameraDevices()
  const device = devices.back
  const isAppForeground = useIsAppForeground()

  return (
    <Camera
      style={StyleSheet.absoluteFill}
      device={device}
      isActive={isAppForeground}
    />
  )
}
```

> Note: If you don't care about fast resume times you can also fully unmount the `<Camera>` view instead, which will use a lot less memory (RAM).
