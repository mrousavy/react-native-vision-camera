/**
 * Represents a subscription to any kind of
 * listener.
 *
 * You can remove the subscription by calling
 * {@linkcode remove | remove()}.
 */
export interface ListenerSubscription {
  /**
   * Remove the listener subscription.
   *
   * You can call this in a `useEffect`'s
   * cleanup function.
   */
  remove: () => void
}
