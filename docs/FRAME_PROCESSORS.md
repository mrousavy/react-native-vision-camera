<table>
<tr>
<th><a href="../README.md">README</a></th>
<th><a href="./SETUP.md">SETUP</a></th>
<th><a href="./DEVICES.md">DEVICES</a></th>
<th><a href="./FORMATS.md">FORMATS</a></th>
<th>FRAME_PROCESSORS</th>
<th><a href="./ANIMATED.md">ANIMATED</a></th>
<th><a href="./ERRORS.md">ERRORS</a></th>
</tr>
</table>

<br/>

<h1 align="center">Frame Processors</h1>

<div>
<!-- TODO: Demo of QR code scanning or smth -->
  <img align="right" width="35%" src="../img/ultra-wide-demo.gif">
</div>

### What are frame processors?

Frame processors are functions that are written in JavaScript (or TypeScript) which can be used to **process frames the camera "sees"**.

For example, you might want to create a QR code scanner _without ever writing native code while still achieving almost-native performance_. Since you can write the scanning part yourself, you can implement a custom QR code system like the one Snapchat uses for Snap-codes.

<div align="center">
  <img src="../img/snap-code.png" width="15%" />
</div>
<br />

Frame processors are by far not limited to QR code detection, other examples include:

* **AI** for **facial recognition**
* **AI** for **object detection**
* Using **Tensorflow**, **MLKit Vision** or other libraries (if they provide React Native JSI bindings in the form of "react-native-vision-camera plugins")
* Creating **realtime video-chats** since you can directly send the camera frames over the network
* Creating **snapchat-like filters**, e.g. draw a dog-mask filter over the user's face (WIP)
* Creating **color filters** with depth-detection
* Using **custom C++ processors** exposed to JS for maximum performance

### Technical

Frame processors are JS functions that will be **workletized** using [react-native-reanimated](https://github.com/software-mansion/react-native-reanimated). They are created on a **separate thread** using a separate Hermes/JSC Runtime and are **invoked synchronously** (using JSI) without ever going over the bridge.

### Example

```tsx
function App() {
  const frameProcessor = useFrameProcessor((frame) => {
    const qrCodes = scanQrCodes(frame)
    console.log(qrCodes)
  }, [])

  return (
    <Camera frameProcessor={frameProcessor} {...cameraProps} />
  )
}
```

> FRAME PROCESSORS ARE STILL WIP
