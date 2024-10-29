"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ReanimatedProxy = void 0;
var _ModuleProxy = require("./ModuleProxy");
/**
 * A proxy object that lazy-imports react-native-reanimated as soon as the
 * caller tries to access a property on {@linkcode ReanimatedProxy}.
 *
 * If react-native-reanimated is not installed, accessing anything on
 * {@linkcode ReanimatedProxy} will throw.
 */
const ReanimatedProxy = exports.ReanimatedProxy = (0, _ModuleProxy.createModuleProxy)(() => {
  try {
    return require('react-native-reanimated');
  } catch (e) {
    throw new _ModuleProxy.OptionalDependencyNotInstalledError('react-native-reanimated');
  }
});
//# sourceMappingURL=ReanimatedProxy.js.map