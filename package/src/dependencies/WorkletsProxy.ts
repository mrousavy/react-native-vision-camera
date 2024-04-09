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

export const WorkletsProxy = proxy as unknown as TWorklets
