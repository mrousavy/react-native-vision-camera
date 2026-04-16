# react-native-vision-camera-location

This is VisionCamera Location. Install it through npm:

```sh
npm install react-native-vision-camera-location
```

VisionCamera Location depends on VisionCamera Core.

```sh
# Make sure VisionCamera Core is installed.
```

Then, add Location permission to your app's manifests - either in an Expo, or a bare React Native workflow:

#### Expo

Add location permission to your Expo config (`app.json`, `app.config.json` or `app.config.js`):

```json
{
  // [!code ++:5]
  "ios": {
    "infoPlist": {
      "NSLocationWhenInUseUsageDescription": "$(PRODUCT_NAME) needs access to your Location to add GPS tags to captured photos.",
    }
  },
  // [!code ++:3]
  "android": {
    "permissions": ["android.permission.ACCESS_FINE_LOCATION", "android.permission.ACCESS_COARSE_LOCATION"]
  }
}
```

#### Bare React Native

Add `NSLocationWhenInUseUsageDescription` permissions to your app's `Info.plist`:

```xml
<dict>
  <!-- ... -->
  // [!code ++:2]
	<key>NSLocationWhenInUseUsageDescription</key>
	<string>$(PRODUCT_NAME) needs access to your Location to add GPS tags to captured photos.</string>
</dict>
```

Add `ACCESS_FINE_LOCATION` and `ACCESS_COARSE_LOCATION` permissions to your app's `AndroidManifest.xml`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
  <!-- ... -->
  // [!code ++]
  <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
  // [!code ++]
  <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
</manifest>
```

Then, update your native project:

```sh
npx pod-install
```

And rebuild your app.
