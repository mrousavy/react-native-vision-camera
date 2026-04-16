import { NitroModules } from 'react-native-nitro-modules'
import type { LocationManagerFactory } from './specs/LocationManagerFactory.nitro'

export const locationFactory =
  NitroModules.createHybridObject<LocationManagerFactory>(
    'LocationManagerFactory',
  )
