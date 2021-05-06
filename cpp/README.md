# cpp

This folder contains the Shared C++ code for react-native-vision-camera.

## Prerequesites

1. For Android, download the [NDK and build tools](https://developer.android.com/studio/projects/add-native-code#download-ndk)
2. For iOS, Xcode will be enough.
3. Install cpplint
    ```sh
    brew install cpplint
    ```

## Getting Started

It is recommended that you work on the code using the Example project (`example/android/` or `example/ios/VisionCameraExample.xcworkspace`), since that always includes the React Native header files, plus you can easily test changes that way.

You can however still edit the library project here by opening this folder with any C++ editor.

## Committing

Before committing, make sure that you're not violating the cpplint codestyles. To do that, run the following command:

```bash
yarn check-cpp
```
