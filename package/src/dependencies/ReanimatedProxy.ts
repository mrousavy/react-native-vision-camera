import type * as Reanimated from 'react-native-reanimated'
type TReanimated = typeof Reanimated

const proxy = new Proxy(
  { reanimated: undefined as TReanimated | undefined },
  {
    get: (holder, property) => {
      if (holder.reanimated == null) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          holder.reanimated = require('react-native-reanimated') as TReanimated
        } catch (e) {
          throw new Error('react-native-reanimated is not installed!')
        }
      }
      return holder.reanimated[property as keyof typeof holder.reanimated]
    },
  },
)

/**
 * A proxy object that lazy-imports react-native-reanimated as soon as the
 * caller tries to access a property on {@linkcode ReanimatedProxy}.
 *
 * If react-native-reanimated is not installed, accessing anything on
 * {@linkcode ReanimatedProxy} will throw.
 */
export const ReanimatedProxy = proxy as unknown as TReanimated
