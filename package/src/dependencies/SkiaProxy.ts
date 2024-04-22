import type * as Skia from '@shopify/react-native-skia'
import { createModuleProxy, OptionalDependencyNotInstalledError } from './ModuleProxy'

type TSkia = typeof Skia

/**
 * A proxy object that lazy-imports @shopify/react-native-skia as soon as the
 * caller tries to access a property on {@linkcode SkiaProxy}.
 *
 * If @shopify/react-native-skia is not installed, accessing anything on
 * {@linkcode SkiaProxy} will throw.
 */
export const SkiaProxy = createModuleProxy<TSkia>(() => {
  try {
    return require('@shopify/react-native-skia')
  } catch (e) {
    throw new OptionalDependencyNotInstalledError('@shopify/react-native-skia')
  }
})
