<h1 align="center">Troubleshooting</h1>

<div>
  <img align="right" width="35%" src="../img/11_back.png">
</div>

Before opening an issue, make sure you try the following:

## iOS

1. Try cleaning and rebuilding **everything**:
   ```sh
   rm -rf package-lock.json && rm -rf yarn.lock && rm -rf node_modules && rm -rf ios/Podfile.lock && rm -rf ios/Pods
   npm i  # or "yarn"
   cd ios && pod repo update && pod update && pod install
   ```
2. Check your minimum iOS version. react-native-vision-camera requires a minimum iOS version of **11.0**. Try updating your `Podfile` iOS version at the top.
3. Check your Swift version. react-native-vision-camera requires a minimum Swift version of **5.2**. Try removing all references to Swift-5.0 in the `LIBRARY_SEARCH_PATH` list (see [this Stackoverflow answer](https://stackoverflow.com/a/66281846/5281431))
4. Make sure you have created a Swift bridging header in your project.
   1. Open your project with Xcode (`Example.xcworkspace`)
   2. In the menu-bar, press **File** > **New** > **File** (<kbd>⌘</kbd> + <kbd>N</kbd>)
   4. Use whatever name you prefer, e.g. `File.swift`, and press **Create**
   5. Press **Create Bridging Header** when promted.
5. If you're experiencing weird behaviour, check the logs in Xcode to find out more.

## Android

1. Since the Android implementation uses the not-yet fully stable **CameraX** API, make sure you've browsed the [CameraX issue tracker](https://issuetracker.google.com/issues?q=componentid:618491%20status:open) to find out if your issue is a limitation by the **CameraX** library even I cannot get around.
2. If you're experiencing weird behaviour, check the logs in Android Studio/Logcat (<kbd>⌘</kbd> + <kbd>6</kbd>) to find out more.
3. If a camera device is not being returned by `getAvailableCameraDevices()`, make sure it meets the minimum requirements - that is minum supported harwdware level of `LIMITED` and above. See [this section in the Android docs](https://developer.android.com/reference/android/hardware/camera2/CameraDevice) for more information.
