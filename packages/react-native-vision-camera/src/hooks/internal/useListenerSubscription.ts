import { useLayoutEffect } from 'react'
import type { ListenerSubscription } from '../../specs/common-types/ListenerSubscription'
import { useStableCallback } from './useStableCallback'

type ListenerMethodName<T> = {
  [K in keyof T]: T[K] extends (
    listener: infer _Listener,
  ) => ListenerSubscription
    ? K
    : never
}[keyof T]

/**
 * Attaches the listener subscription ({@linkcode callback}) to the
 * function ({@linkcode subscriberFuncName}) on the {@linkcode object}.
 * When this component unmounts (or the params change), the listener
 * will be removed.
 */
export function useListenerSubscription<T, K extends ListenerMethodName<T>>(
  object: T | undefined,
  subscriberFuncName: K,
  callback: T[K] extends (listener: infer L) => ListenerSubscription
    ? L | undefined
    : never,
): void {
  const stableCallback = useStableCallback(callback)

  // Subscribe during layout so passive effects (e.g. start/stop) cannot emit before listeners are attached.
  useLayoutEffect(() => {
    if (object == null) return
    if (stableCallback == null) return

    type Func = (_: typeof stableCallback) => ListenerSubscription
    const listener = (object[subscriberFuncName] as Func)(stableCallback)
    return () => listener.remove()
  }, [stableCallback, object, subscriberFuncName])
}
