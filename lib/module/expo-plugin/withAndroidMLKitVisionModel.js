import { withGradleProperties } from '@expo/config-plugins';
/**
 * Set the `VisionCamera_enableCodeScanner` value in the static `gradle.properties` file.
 * This is used to add the full MLKit dependency to the project.
 */
export const withAndroidMLKitVisionModel = c => {
  const key = 'VisionCamera_enableCodeScanner';
  return withGradleProperties(c, config => {
    config.modResults = config.modResults.filter(item => {
      if (item.type === 'property' && item.key === key) return false;
      return true;
    });
    config.modResults.push({
      type: 'property',
      key: key,
      value: 'true'
    });
    return config;
  });
};
//# sourceMappingURL=withAndroidMLKitVisionModel.js.map