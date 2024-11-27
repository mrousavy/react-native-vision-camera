"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SkiaProxy = void 0;
var _ModuleProxy = require("./ModuleProxy");
/**
 * A proxy object that lazy-imports @shopify/react-native-skia as soon as the
 * caller tries to access a property on {@linkcode SkiaProxy}.
 *
 * If @shopify/react-native-skia is not installed, accessing anything on
 * {@linkcode SkiaProxy} will throw.
 */
const SkiaProxy = exports.SkiaProxy = (0, _ModuleProxy.createModuleProxy)(() => {
  try {
    return require('@shopify/react-native-skia');
  } catch (e) {
    throw new _ModuleProxy.OptionalDependencyNotInstalledError('@shopify/react-native-skia');
  }
});
//# sourceMappingURL=SkiaProxy.js.map