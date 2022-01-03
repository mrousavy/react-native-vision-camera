import { ConfigPlugin, withAppBuildGradle } from '@expo/config-plugins';

/**
 * Add pickFirst libraries into app/build.gradle to fix build errors.
 * This is a dangerous operation. It will override packagingOptions {} or android { packagingOptions {} } - use with caution as it might break your app
 * [Learn more](https://github.com/mrousavy/react-native-vision-camera/pull/545)
 * Credits: @mercyaj [Credits](https://github.com/mrousavy/react-native-vision-camera/pull/545#issuecomment-949477264)
 */

export const withDangerouslyHandleAndroidSharedLibrary: ConfigPlugin = (config) => {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      const body = `
        pickFirst 'lib/x86/libc++_shared.so'
        pickFirst 'lib/x86_64/libc++_shared.so'
        pickFirst 'lib/armeabi-v7a/libc++_shared.so'
        pickFirst 'lib/arm64-v8a/libc++_shared.so'
      `;
      const regexpPackagingOptions = /\bpackagingOptions\s*{[^}]*}/;
      const packagingOptionsMatch = config.modResults.contents.match(regexpPackagingOptions);

      if (packagingOptionsMatch != null) {
        console.warn(
          'WARN: react-native-vision-camera [withDangerouslyHandleAndroidSharedLibrary]: Replacing packagingOptions in android/app/build.gradle. This will have negative side effects if you made changes there.',
        );

        config.modResults.contents = config.modResults.contents.replace(
          regexpPackagingOptions,
          `\n\tpackagingOptions {
            \t${body}
          }\n`,
        );
      }

      const regexpAndroid = /\nandroid\s*{/;
      const androidMatch = config.modResults.contents.match(regexpAndroid);

      if (androidMatch != null) {
        console.warn(
          'WARN: react-native-vision-camera [withDangerouslyHandleAndroidSharedLibrary]: Replacing packagingOptions inside android {} in android/app/build.gradle. This will have negative side effects if you made any changes there.',
        );
        config.modResults.contents = config.modResults.contents.replace(
          regexpAndroid,
          `\n\tandroid {
      packagingOptions {
            \t${body}
    }\n`,
        );
      } else {
        throw new Error(
          'Error: react-native-vision-camera [withDangerouslyHandleAndroidSharedLibrary]: Could not find where to add packagingOptions',
        );
      }
    } else {
      throw new Error(
        'react-native-vision-camera: Cannot run withDangerouslyHandleAndroidSharedLibrary because the build.gradle is not groovy',
      );
    }
    return config;
  });
};
