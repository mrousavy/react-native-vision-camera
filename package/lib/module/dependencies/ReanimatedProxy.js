import { createModuleProxy, OptionalDependencyNotInstalledError } from './ModuleProxy';
/**
 * A proxy object that lazy-imports react-native-reanimated as soon as the
 * caller tries to access a property on {@linkcode ReanimatedProxy}.
 *
 * If react-native-reanimated is not installed, accessing anything on
 * {@linkcode ReanimatedProxy} will throw.
 */
export const ReanimatedProxy = createModuleProxy(() => {
  try {
    return require('react-native-reanimated');
  } catch (e) {
    throw new OptionalDependencyNotInstalledError('react-native-reanimated');
  }
});
//# sourceMappingURL=ReanimatedProxy.js.map