import type * as Skia from '@shopify/react-native-skia'
type TSkia = typeof Skia

const proxy = new Proxy(
  { skia: undefined as TSkia | undefined },
  {
    get: (holder, property) => {
      if (holder.skia == null) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          holder.skia = require('@shopify/react-native-skia') as TSkia
        } catch (e) {
          throw new Error('@shopify/react-native-skia is not installed!')
        }
      }
      return holder.skia[property as keyof typeof holder.skia]
    },
  },
)

/**
 * A proxy object that lazy-imports @shopify/react-native-skia as soon as the
 * caller tries to access a property on {@linkcode SkiaProxy}.
 *
 * If @shopify/react-native-skia is not installed, accessing anything on
 * {@linkcode SkiaProxy} will throw.
 */
export const SkiaProxy = proxy as unknown as TSkia
