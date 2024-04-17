import type * as Worklets from 'react-native-worklets-core'
import { createModuleProxy } from './ModuleProxy'
type TWorklets = typeof Worklets

/**
 * A proxy object that lazy-imports react-native-worklets-core as soon as the
 * caller tries to access a property on {@linkcode WorkletsProxy}.
 *
 * If react-native-worklets-core is not installed, accessing anything on
 * {@linkcode WorkletsProxy} will throw.
 */
export const WorkletsProxy = createModuleProxy<TWorklets>('react-native-worklets-core', () => require('react-native-worklets-core'))
