# TODO

This is an internal TODO list which I am using to keep track of some of the features that are still missing.

* [ ] Mirror images from selfie cameras (iOS Done, Android WIP)
* [ ] Allow camera switching (front <-> back) while recording and stich videos together
* [ ] Make `startRecording()` async. Due to NativeModules limitations, we can only have either one callback or one promise in a native function. For `startRecording()` we need both, since you probably also want to catch any errors that occured during a `startRecording()` call (or wait until the recording has actually started, since this can also take some time)
* [ ] Return a `jsi::Value` reference for images (`UIImage`/`Bitmap`) on `takePhoto()` and `takeSnapshot()`. This way, we skip the entire file writing and reading, making image capture _a lot_ faster.
* [ ] Implement frame processors. The idea here is that the user passes a small JS function (reanimated worklet) to the `Camera::frameProcessor` prop which will then get called on every frame the camera previews. (I'd say we cap it to 30 times per second, even if the camera fps is higher) This can then be used to scan QR codes, detect faces, detect depth, render something ontop of the camera such as color filters, QR code boundaries or even dog filters, possibly even use AR - all from a single, small, and highly flexible JS function!
* [ ] Create a custom MPEG4 encoder to allow for more customizability in `recordVideo()` (`bitRate`, `priority`, `minQuantizationParameter`, `allowFrameReordering`, `expectedFrameRate`, `realTime`, `minimizeMemoryUsage`)
