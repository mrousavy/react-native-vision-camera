"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.withEnableFrameProcessorsIOS = void 0;
var _configPlugins = require("@expo/config-plugins");
var _writeToPodfile = require("./writeToPodfile");
/**
 * Set the `enableFrameProcessors` flag inside of the XcodeProject.
 * This is used to disable frame processors if you don't need it on iOS. (will save CPU and Memory)
 */
const withEnableFrameProcessorsIOS = (c, enableFrameProcessors) => {
  return (0, _configPlugins.withDangerousMod)(c, ['ios', config => {
    (0, _writeToPodfile.writeToPodfile)(config.modRequest.projectRoot, '$VCEnableFrameProcessors', String(enableFrameProcessors));
    return config;
  }]);
};
exports.withEnableFrameProcessorsIOS = withEnableFrameProcessorsIOS;
//# sourceMappingURL=withEnableFrameProcessorsIOS.js.map