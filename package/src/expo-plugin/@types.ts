export type ConfigProps = {
  /**
   * The text to show in the native dialog when asking for Camera Permissions.
   * @default 'Allow $(PRODUCT_NAME) to access your camera'
   */
  cameraPermissionText?: string
  /**
   * Whether to add Microphone Permissions to the native manifest or not.
   * @default false
   */
  enableMicrophonePermission?: boolean
  /**
   * Whether to add Location Permissions to the native manifest or not.
   *
   * On iOS, this also fully removes the location-related APIs (`CLLocationManager`) from the compiled app.
   * @default false
   */
  enableLocation?: boolean
  /**
   * The text to show in the native dialog when asking for Microphone Permissions.
   * @default 'Allow $(PRODUCT_NAME) to access your microphone'
   */
  microphonePermissionText?: string
  /**
   * The text to show in the native dialog when asking for Location Permissions.
   * @default 'Allow $(PRODUCT_NAME) to access your location'
   */
  locationPermissionText?: string
  /**
   * Whether to enable the Frame Processors runtime, or explicitly disable it.
   * Disabling Frame Processors will make your app smaller as the C++ files will not be compiled.
   * See [Frame Processors](https://react-native-vision-camera.com/docs/guides/frame-processors)
   *
   * Note: When react-native-worklets-core is not installed, Frame Processors are automatically disabled anyways.
   * @default true
   */
  enableFrameProcessors?: boolean
  /**
   * Whether to enable the QR/Barcode Scanner Model.
   *
   * - When set to `true`, the MLKit Model will be bundled alongside
   * with your app. (~2.4 MB in size).
   * - When set to `false`, it can still be downloaded on-the-fly on devices with Google Play Services installed if you are using the `CodeScanner`.
   *
   * See [QR/Barcode Scanning](https://react-native-vision-camera.com/docs/guides/code-scanning)
   *
   * @default false
   */
  enableCodeScanner?: boolean
  /**
   * Android Only
   * Whether to require the camera through Androids uses-feature flag.
   *
   * When set to `true`, the app will only be available in Play Store for phones with a camera.
   * When set to `false`, the feature will not be required, and the app will be discoverable for devices without a camera.
   * If it is `undefined` or `null`, the uses-feature flag will not be added to the AndroidManifest.
   *
   * @default undefined
   */
  requiresCamera?: boolean | null
  /**
   * Android Only
   * Whether to require the microphone through Androids uses-feature flag.
   *
   * When set to `true`, the app will only be available in Play Store for phones with a microphone.
   * When set to `false`, the feature will not be required, and the app will be discoverable for devices without a microphone.
   * If it is `undefined` or `null`, the uses-feature flag will not be added to the AndroidManifest.
   *
   * @default undefined
   */
  requiresMicrophone?: boolean | null
}
