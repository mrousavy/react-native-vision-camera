"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.WorkletsProxy = void 0;
var _ModuleProxy = require("./ModuleProxy");
/**
 * A proxy object that lazy-imports react-native-worklets-core as soon as the
 * caller tries to access a property on {@linkcode WorkletsProxy}.
 *
 * If react-native-worklets-core is not installed, accessing anything on
 * {@linkcode WorkletsProxy} will throw.
 */
const WorkletsProxy = exports.WorkletsProxy = (0, _ModuleProxy.createModuleProxy)(() => {
  try {
    return require('react-native-worklets-core');
  } catch (e) {
    throw new _ModuleProxy.OptionalDependencyNotInstalledError('react-native-worklets-core');
  }
});
//# sourceMappingURL=WorkletsProxy.js.map