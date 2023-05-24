"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.withDisableFrameProcessorsAndroid = void 0;

var _configPlugins = require("@expo/config-plugins");

/**
 * Set the `disableFrameProcessors` value in the static `gradle.properties` file.
 * This is used to disable frame processors if you don't need it for android.
 */
const withDisableFrameProcessorsAndroid = c => {
  const disableFrameProcessorsKey = 'disableFrameProcessors';
  return (0, _configPlugins.withGradleProperties)(c, config => {
    config.modResults = config.modResults.filter(item => {
      if (item.type === 'property' && item.key === disableFrameProcessorsKey) return false;
      return true;
    });
    config.modResults.push({
      type: 'property',
      key: disableFrameProcessorsKey,
      value: 'true'
    });
    return config;
  });
};

exports.withDisableFrameProcessorsAndroid = withDisableFrameProcessorsAndroid;
//# sourceMappingURL=withDisableFrameProcessorsAndroid.js.map