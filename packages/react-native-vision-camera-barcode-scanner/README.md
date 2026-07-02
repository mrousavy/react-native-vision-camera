# react-native-vision-camera-barcode-scanner

This is VisionCamera Barcode Scanner. Install it through npm:

```sh
npm install react-native-vision-camera-barcode-scanner react-native-nitro-image
```

VisionCamera Barcode Scanner depends on VisionCamera Core and Nitro Image.

```sh
# Make sure VisionCamera Core is installed as well.
```

You can scan live camera frames, attach a Barcode Scanner output, or scan an existing Nitro Image with `BarcodeScanner.scanCodesInImageAsync(...)`.

## Minimum Requirements

The `GoogleMLKit/BarcodeScanning` dependency (version `9.0.0`) requires a minimum iOS target version of 15.5. Adjust it in your `Podfile` if needed.

Then, update your native project:

```sh
npx pod-install
```

And rebuild your app.
