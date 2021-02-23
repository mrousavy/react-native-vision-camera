<table>
<tr>
<th>README</th>
<th><a href="./docs/DEVICES.md">DEVICES</a></th>
<th><a href="./docs/FORMATS.md">FORMATS</a></th>
<th><a href="./docs/FRAME_PROCESSORS.md">FRAME_PROCESSORS</a></th>
<th><a href="./docs/ANIMATED.md">ANIMATED</a></th>
<th><a href="./docs/ERRORS.md">ERRORS</a></th>
</tr>
</table>

<br/>
<br/>

<h1 align="center">Camera</h1>

<div align="center">
  <img src="img/11.png" width="55%">
  <br />
  <br />
  <blockquote><h4>📸 The Camera library that sees the vision.</h4></blockquote>
  <br />
  <a href='https://ko-fi.com/F1F8CLXG' target='_blank'><img height='36' style='border:0px;height:36px;' src='https://az743702.vo.msecnd.net/cdn/kofi2.png?v=0' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>
  <br />
  <a href="https://www.npmjs.com/package/react-native-vision-camera"><img src="https://img.shields.io/npm/v/react-native-vision-camera?color=%239ba298"</a>
  <br />
  <a href="https://www.npmjs.com/package/react-native-vision-camera"><img src="https://img.shields.io/npm/dt/react-native-vision-camera?color=%239ba298"</a>
  <br />
  <a href="https://github.com/mrousavy?tab=followers"><img src="https://img.shields.io/github/followers/mrousavy?label=Follow%20%40mrousavy&style=social"></a>
  <br />
  <a href="https://twitter.com/mrousavy"><img src="https://img.shields.io/twitter/follow/mrousavy?label=Follow%20%40mrousavy&style=social"></a>
</div>

<br/>
<br/>

<div>
  <img align="right" width="35%" src="./img/example.png">
</div>

### Install

```sh
npm i react-native-vision-camera
npx pod-install
```

### Features

* Photo and Video capture
* Customizable device (`ultra-wide-angle`, `wide-angle`, `telephoto` and virtual multi-cameras)
* Customizable FPS
* JS worklet frame processors powered by JSI and Reanimated
* Reanimated zooming
* HDR & Night modes

> See the [example](./example/) app

### Example


```tsx
function App() {
  const devices = useCameraDevices('wide-angle-camera')
  const device = devices.back

  return (
    <Camera
      style={StyleSheet.absoluteFill}
      device={device}
      isActive={true}
    />
  )
}
```
