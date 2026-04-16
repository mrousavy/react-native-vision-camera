# react-native-vision-camera-worklets

This is the VisionCamera Worklets plugin, which connects [react-native-worklets](https://docs.swmansion.com/react-native-worklets/docs/) to **react-native-vision-camera** to provide an implementation for Frame Processors / `useFrameOutput(...)` / `AsyncRunner`.

Install it through npm:

```sh
npm install react-native-vision-camera-worklets
```

VisionCamera Worklets depends on VisionCamera Core, and [react-native-worklets](https://docs.swmansion.com/react-native-worklets/docs/):

```sh
# Make sure VisionCamera Core is installed.
npm install react-native-worklets
```

Then, update your native project:

```sh
npx pod-install
```

And rebuild your app.
