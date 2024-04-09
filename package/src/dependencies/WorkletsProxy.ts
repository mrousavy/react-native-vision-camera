import type * as Worklets from 'react-native-worklets-core'
type TWorklets = typeof Worklets

const proxy = new Proxy(
  { worklets: undefined as TWorklets | undefined },
  {
    get: (holder, property) => {
      if (holder.worklets == null) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          holder.worklets = require('react-native-worklets-core') as TWorklets
        } catch (e) {
          throw new Error('react-native-worklets-core is not installed!')
        }
      }
      return holder.worklets[property as keyof typeof holder.worklets]
    },
  },
)

/**
 * A proxy object that lazy-imports react-native-worklets-core as soon as the
 * caller tries to access a property on {@linkcode WorkletsProxy}.
 *
 * If react-native-worklets-core is not installed, accessing anything on
 * {@linkcode WorkletsProxy} will throw.
 */
export const WorkletsProxy = proxy as unknown as TWorklets
