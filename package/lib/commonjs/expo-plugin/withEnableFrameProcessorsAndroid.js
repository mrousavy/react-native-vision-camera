"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.withEnableFrameProcessorsAndroid = void 0;
var _configPlugins = require("@expo/config-plugins");
/**
 * Set the `VisionCamera_enableFrameProcessors` value in the static `gradle.properties` file.
 * This is used to disable frame processors if you don't need it for android.
 */
const withEnableFrameProcessorsAndroid = (c, enableFrameProcessors) => {
  const enableFrameProcessorsKey = 'VisionCamera_enableFrameProcessors';
  return (0, _configPlugins.withGradleProperties)(c, config => {
    config.modResults = config.modResults.filter(item => {
      if (item.type === 'property' && item.key === enableFrameProcessorsKey) return false;
      return true;
    });
    config.modResults.push({
      type: 'property',
      key: enableFrameProcessorsKey,
      value: String(enableFrameProcessors)
    });
    return config;
  });
};
exports.withEnableFrameProcessorsAndroid = withEnableFrameProcessorsAndroid;
//# sourceMappingURL=withEnableFrameProcessorsAndroid.js.map