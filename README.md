<h1 align="center">Vision Camera</h1>

<div align="center">
  <img src="docs/static/img/11.png" width="50%">
  <br />
  <br />
  <blockquote><h4>📸 The Camera library that sees the vision.</h4></blockquote>
  <br />

  <a href="https://cuvent.com">
    <img height="40" src="docs/static/img/cuvent-logo-text.svg" />
  </a>
  <br/>
  <span>
    <a align="center" href="https://github.com/mrousavy?tab=followers">
      <img src="https://img.shields.io/github/followers/mrousavy?label=Follow%20%40mrousavy&style=social" />
    </a>
  </span>
  <br />
  <span>
    <a align="center" href="https://twitter.com/mrousavy">
      <img src="https://img.shields.io/twitter/follow/mrousavy?label=Follow%20%40mrousavy&style=social" />
    </a>
    <a align="center" href="https://twitter.com/cuventtech">
      <img src="https://img.shields.io/twitter/follow/cuventtech?label=Follow%20%40cuventtech&style=social" />
    </a>
  </span>
</div>

<br/>
<br/>

<div>
  <img align="right" width="35%" src="docs/static/img/example.png">
</div>

### Documentation

* [Guides](https://cuvent.github.io/react-native-vision-camera/docs/guides)
* [API](https://cuvent.github.io/react-native-vision-camera/docs/api)
* [Example](./example/)

### Install

```sh
npm i react-native-vision-camera
npx pod-install
```

### Features

* Photo and Video capture
* Customizable device (`ultra-wide-angle`, `wide-angle`, `telephoto` and virtual multi-cameras)
* Customizable FPS
* JS worklet frame processors powered by JSI and Reanimated (**Work in progress: [#2](https://github.com/cuvent/react-native-vision-camera/pull/2)**)
* Reanimated zooming
* HDR & Night modes

> See the [example](./example/) app

### Example


```tsx
function App() {
  const devices = useCameraDevices('wide-angle-camera')
  const device = devices.back

  if (device == null) return <LoadingView />
  return (
    <Camera
      style={StyleSheet.absoluteFill}
      device={device}
      isActive={true}
    />
  )
}
```

<br />

#### 🚀 Get started by [setting up permissions](https://cuvent.github.io/react-native-vision-camera/docs/)!
