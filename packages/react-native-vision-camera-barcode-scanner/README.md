# react-native-vision-camera-barcode-scanner

This is VisionCamera Barcode Scanner. Install it through npm:

```sh
npm install react-native-vision-camera-barcode-scanner
```

VisionCamera Barcode Scanner depends on VisionCamera Core.

```sh
# Make sure VisionCamera Core is installed.
```

Then, update your native project:

```sh
npx pod-install
```

And rebuild your app.

## iOS: Building without MLKit (CI / arm64 Simulator)

The barcode scanner uses Google's MLKit on iOS. MLKit's binaries don't ship an `arm64-iphonesimulator` slice — only `arm64-iphoneos` and `x86_64-iphonesimulator`. To work around this, MLKit's pods set `EXCLUDED_ARCHS[sdk=iphonesimulator*] = arm64`, which propagates to your app and forces simulators to run as x86_64 via Rosetta on Apple Silicon Macs. This is automatic and requires no setup for typical local development.

CI builds that explicitly target the arm64 iOS Simulator (e.g. `xcodebuild -arch arm64 -destination 'platform=iOS Simulator,arch=arm64,...'`, or Apple Silicon runners without Rosetta installed) will fail to link MLKit. If you need the build to succeed in that environment, you can opt out of MLKit at `pod install` time:

```sh
VISION_CAMERA_DISABLE_MLKIT=1 npx pod-install
```

This drops the `GoogleMLKit/BarcodeScanning` pod entirely, removes the `EXCLUDED_ARCHS` constraint, and lets your app build natively on arm64 iOS Simulator. The barcode scanner JS API still exists, but `useBarcodeScanner` and the `barcodeScanner` output throw a clear runtime error when invoked. This is intended for compile-only CI smoke tests — barcode scanning never works in simulators anyway because the camera isn't real.

To go back to a normal build, run `pod install` again without the env var.
