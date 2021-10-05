# Contributing

## Guidelines

1. Don't be rude.

## Get started

1. Fork & clone the repository
2. Install dependencies
   ```
   cd react-native-vision-camera
   yarn bootstrap
   ```

Read the READMEs in [`android/`](android/README.md) and [`ios/`](ios/README.md) for a quick overview of the native development workflow.

> You can also open VisionCamera in [a quick online editor (github1s)](https://github1s.com/mrousavy/react-native-vision-camera)

### JS/TS

1. Open the entire folder in Visual Studio Code
2. Start the metro bundler in the `example/` directory using `yarn start`
3. Run either the iOS or Android project to test changes

> Run `yarn check-js` to validate codestyle

### iOS

1. Open the `example/ios/VisionCameraExample.xcworkspace` file with Xcode
2. Change signing configuration to your developer account
3. Select your device in the devices drop-down
4. Hit run

> Run `yarn check-ios` to validate codestyle

### Android

1. Open the `example/android/` folder with Android Studio
2. Start the metro bundler in the `example/` directory using `yarn start`
3. Select your device in the devices drop-down
4. Hit run

> Run `yarn check-android` to validate codestyle

### Docs

1. Edit the relevant file, it may be easiest to search for what you're editing to find the right file
2. Install all dependencies by running `yarn` inside the `docs` folder

> Run `yarn start` to generate the docs, you can then view them in your browser to confirm your changes

## Committing

### Codestyle

Great code produces great products. That's why we love to keep our codebases clean, and to achieve that, we use linters and formatters which output errors when something isn't formatted the way we like it to be.

Before pushing your changes, you can verify that everything is still correctly formatted by running all linters:

```
yarn check-all
```

This validates Swift, Kotlin, C++ and JS/TS code:

```bash
$ yarn check-all
   yarn run v1.22.10
   Formatting Swift code..
   Linting Swift code..
   Linting Kotlin code..
   Linting C++ code..
   Linting JS/TS code..
   All done!
   ✨  Done in 8.05s.
```

### PR messages

When creating a pull-request, make sure to use the [conventional changelog](https://github.com/conventional-changelog/conventional-changelog) format for it's title:

* ✨ For new features or enhancements, use `feat`. Example: `feat: Support ultra-wide-angle cameras`
* 🐛 For bugfixes or build improvements, use `fix`. Example: `fix: Fix iOS 13 crash when switching cameras`
* 💨 For performance improvements, use `perf`. Example: `perf: Improve takePhoto() performance by re-using file-session`
* 🛠️ When upgrading dependencies, use `chore(deps)`. Example: `chore(deps): Upgrade react-native to 0.70`
* 📚 When changing anything in the documentation, use `docs`. Example: `docs: Fix typo in installation instructions`

Pull-requests will be squash-committed, so no need to prefix your individual commits with the conventional changelog format as long as the commit messages are descriptive.
