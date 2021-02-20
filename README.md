<table>
<tr>
<th>README.md</th>
<th><a href="./docs/ANIMATED.md">ANIMATED.md</a></th>
<th><a href="./docs/DEVICES.md">DEVICES.md</a></th>
<th><a href="./docs/FORMATS.md">FORMATS.md</a></th>
<th><a href="./docs/ERRORS.md">ERRORS.md</a></th>
</tr>
</table>

<br />

<div align="center">
  <h1 align="center">Camera</h1>
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
  const device = useCameraDevice('wide-angle')

  return (
    <Camera
      style={StyleSheet.absoluteFill}
      device={device}
    />
  )
}
```
