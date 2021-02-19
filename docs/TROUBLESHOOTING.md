# Troubleshooting

Before opening an issue, make sure you try the following:

## iOS

1. Try cleaning and rebuilding **everything**:
   ```sh
   rm -rf package-lock.json && rm -rf yarn.lock && rm -rf node_modules && rm -rf ios/Podfile.lock && rm -rf ios/Pods
   npm i  # or "yarn"
   cd ios && pod repo update && pod update && pod install
   ```
2. Check your minimum iOS version. react-native-vision-camera requires a minimum iOS version of **11.0**.
3. Check your Swift version. react-native-vision-camera requires a minimum Swift version of **5.2**.
4. Make sure you have created a Swift bridging header in your project.
   1. Open your project with Xcode (`Example.xcworkspace`)
   2. In the menu-bar, press **File** > **New** > **File** (⌘N)
   3. Use whatever name you prefer, e.g. `File.swift`, and press **Create**
   4. Press **Create Bridging Header** when promted.

## Android

1. Since the Android implementation uses the not-yet fully stable **CameraX** API, make sure you've browsed the [CameraX issue tracker](https://issuetracker.google.com/issues?q=componentid:618491%20status:open) to find out if your issue is a limitation by the **CameraX** library even I cannot get around.
