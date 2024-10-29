import { createModuleProxy, OptionalDependencyNotInstalledError } from './ModuleProxy';
/**
 * A proxy object that lazy-imports react-native-worklets-core as soon as the
 * caller tries to access a property on {@linkcode WorkletsProxy}.
 *
 * If react-native-worklets-core is not installed, accessing anything on
 * {@linkcode WorkletsProxy} will throw.
 */
export const WorkletsProxy = createModuleProxy(() => {
  try {
    return require('react-native-worklets-core');
  } catch (e) {
    throw new OptionalDependencyNotInstalledError('react-native-worklets-core');
  }
});
//# sourceMappingURL=WorkletsProxy.js.map