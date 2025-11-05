import type { HybridObject } from 'react-native-nitro-modules'

export interface NativeThread extends HybridObject<{ ios: 'swift' }> {
  /**
   * Get this Thread's ID.
   */
  readonly id: string
  /**
   * - When called from JS, nothing changes - this just delays the call.
   * - When called from C++, this actually runs the {@linkcode task} on this Thread.
   */
  runOnThread(task: () => void): void
}
