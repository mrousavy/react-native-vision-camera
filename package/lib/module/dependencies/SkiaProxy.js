import { createModuleProxy, OptionalDependencyNotInstalledError } from './ModuleProxy';
/**
 * A proxy object that lazy-imports @shopify/react-native-skia as soon as the
 * caller tries to access a property on {@linkcode SkiaProxy}.
 *
 * If @shopify/react-native-skia is not installed, accessing anything on
 * {@linkcode SkiaProxy} will throw.
 */
export const SkiaProxy = createModuleProxy(() => {
  try {
    return require('@shopify/react-native-skia');
  } catch (e) {
    throw new OptionalDependencyNotInstalledError('@shopify/react-native-skia');
  }
});
//# sourceMappingURL=SkiaProxy.js.map