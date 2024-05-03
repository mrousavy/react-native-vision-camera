import type { DependencyList } from 'react'
import { WorkletsProxy } from '../dependencies/WorkletsProxy'

type IWorklets = typeof WorkletsProxy
type Worklet = ReturnType<IWorklets['worklet']>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFunc = (...args: any[]) => any

export function getWorkletDependencies<TFunc extends AnyFunc>(func: TFunc): DependencyList {
  if (__DEV__) {
    // In debug, perform runtime checks to ensure the given func is a safe worklet, and throw an error otherwise
    const worklet = WorkletsProxy.worklet(func)
    return Object.values(worklet.__closure)
  }
  // in release, just cast and assume it's a worklet. if this crashes, the user saw it first in debug anyways.
  return Object.values((func as unknown as Worklet).__closure)
}
