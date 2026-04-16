import { NitroModules } from 'react-native-nitro-modules'
import type { WorkletQueueFactory } from '../specs/WorkletQueueFactory.nitro'

export const HybridWorkletQueueFactory =
  NitroModules.createHybridObject<WorkletQueueFactory>('WorkletQueueFactory')
