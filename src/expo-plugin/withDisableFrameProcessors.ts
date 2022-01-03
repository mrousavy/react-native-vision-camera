import { ConfigPlugin, withGradleProperties } from '@expo/config-plugins';

/**
 * Set the `disableFrameProcessors` value in the static `gradle.properties` file.
 * This is used to disable frame processors if you don't need it for android.
 * TODO: figure out how to do this for iOS, since this requires changes in the user's project.pbxproj - [Learn more](https://github.com/mrousavy/react-native-vision-camera/issues/674)
 */
export const withDisableFrameProcessors: ConfigPlugin<boolean> = (config, isDisabled) => {
  const disableFrameProcessorsKey = 'disableFrameProcessors';
  return withGradleProperties(config, (config) => {
    config.modResults = config.modResults.filter((item) => {
      if (item.type === 'property' && item.key === disableFrameProcessorsKey) return false;

      return true;
    });

    config.modResults.push({
      type: 'property',
      key: disableFrameProcessorsKey,
      value: String(isDisabled),
    });

    return config;
  });
};
