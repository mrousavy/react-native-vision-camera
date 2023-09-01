# ios

This folder contains the iOS-platform-specific code for react-native-vision-camera.

## Prerequesites

1. Install Xcode tools
    ```sh
    xcode-select --install
    ```
2. Install need [SwiftFormat](https://github.com/nicklockwood/SwiftFormat) and [SwiftLint](https://github.com/realm/SwiftLint)
    ```sh
    brew install swiftformat swiftlint
    ```

## Getting Started

It is recommended that you work on the code using the Example project (`example/ios/VisionCameraExample.xcworkspace`), since that always includes the React Native header files, plus you can easily test changes that way.

You can however still edit the library project here by opening `VisionCamera.xcodeproj`, this has the advantage of **automatically formatting your Code** (swiftformat) and **showing you Linter errors** (swiftlint) when trying to build (<kbd>⌘</kbd>+<kbd>B</kbd>).

## Committing

Before committing, make sure that you're not violating the Swift or C++ codestyles. To do that, run the following command:

```bash
yarn check-ios
```

This will also try to automatically fix any errors by re-formatting the Swift code.
