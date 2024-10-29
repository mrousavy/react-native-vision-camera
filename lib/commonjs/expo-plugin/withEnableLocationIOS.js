"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.withEnableLocationIOS = void 0;
var _configPlugins = require("@expo/config-plugins");
var _writeToPodfile = require("./writeToPodfile");
/**
 * Set the `enableLocation` flag inside of the XcodeProject.
 * This is used to enable location APIs.
 * If location is disabled, the CLLocation APIs are not used in the codebase.
 * This is useful if you don't use Location and apple review is unhappy about CLLocation usage.
 */
const withEnableLocationIOS = (c, enableLocation) => {
  return (0, _configPlugins.withDangerousMod)(c, ['ios', config => {
    (0, _writeToPodfile.writeToPodfile)(config.modRequest.projectRoot, '$VCEnableLocation', String(enableLocation));
    return config;
  }]);
};
exports.withEnableLocationIOS = withEnableLocationIOS;
//# sourceMappingURL=withEnableLocationIOS.js.map