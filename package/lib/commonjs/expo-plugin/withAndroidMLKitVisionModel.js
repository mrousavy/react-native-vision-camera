"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.withAndroidMLKitVisionModel = void 0;
var _configPlugins = require("@expo/config-plugins");
/**
 * Set the `VisionCamera_enableCodeScanner` value in the static `gradle.properties` file.
 * This is used to add the full MLKit dependency to the project.
 */
const withAndroidMLKitVisionModel = c => {
  const key = 'VisionCamera_enableCodeScanner';
  return (0, _configPlugins.withGradleProperties)(c, config => {
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
exports.withAndroidMLKitVisionModel = withAndroidMLKitVisionModel;
//# sourceMappingURL=withAndroidMLKitVisionModel.js.map