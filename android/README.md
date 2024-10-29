# android

This folder contains the Android-platform-specific code for react-native-vision-camera.

## Prerequesites

1. Install ktlint
    ```sh
    brew install ktlint
    ```

## Getting Started

It is recommended that you work on the code using the Example project (`example/android/`), since that always includes the React Native header files, plus you can easily test changes that way.

You can however still edit the library project here by opening this folder with Android Studio.

## Committing

Before committing, make sure that you're not violating the Kotlin codestyles. To do that, run the following command:

```bash
bun check-android
```

This will also try to automatically fix any errors by re-formatting the Kotlin code.
