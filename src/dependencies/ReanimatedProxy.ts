import type * as Reanimated from 'react-native-reanimated'
import { createModuleProxy, OptionalDependencyNotInstalledError } from './ModuleProxy'

type TReanimated = typeof Reanimated

/**
 * A proxy object that lazy-imports react-native-reanimated as soon as the
 * caller tries to access a property on {@linkcode ReanimatedProxy}.
 *
 * If react-native-reanimated is not installed, accessing anything on
 * {@linkcode ReanimatedProxy} will throw.
 */
export const ReanimatedProxy = createModuleProxy<TReanimated>(() => {
  try {
    return require('react-native-reanimated')
  } catch (e) {
    throw new OptionalDependencyNotInstalledError('react-native-reanimated')
  }
})
