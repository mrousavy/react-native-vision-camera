import { NitroModules } from 'react-native-nitro-modules'
import type {
  AsyncRunner,
  NativeThread,
  NativeThreadFactory,
  RuntimeThreadProvider,
  useAsyncRunner,
} from 'react-native-vision-camera'
import { createSynchronizable, scheduleOnRuntime } from 'react-native-worklets'
import { createWorkletRuntimeForThread } from './createWorkletRuntimeForThread'

let counter = 1

/**
 * Creates a new {@linkcode AsyncRunner} backed by a dedicated {@linkcode NativeThread}.
 *
 * An {@linkcode AsyncRunner} can be used inside a Frame Processor to offload
 * work to a separate thread without blocking the Camera pipeline.
 *
 * @discussion
 * This is the Worklets-based implementation used by the default
 * {@linkcode RuntimeThreadProvider}. Most users should use
 * {@linkcode useAsyncRunner | useAsyncRunner()} instead.
 *
 * @see {@linkcode useAsyncRunner}
 */
export function createAsyncRunner(): AsyncRunner {
  const isBusy = createSynchronizable(false)
  const threadFactory = NitroModules.createHybridObject<NativeThreadFactory>(
    'NativeThreadFactory',
  )
  const name = `async-runner-${counter++}`
  const thread = threadFactory.createNativeThread(name)
  const workletRuntime = createWorkletRuntimeForThread(thread)

  return {
    isBusy() {
      return isBusy.getBlocking()
    },
    runAsync(task): boolean {
      'worklet'
      if (isBusy.getBlocking()) {
        // false -> Frame was not handled. Caller must drop.
        return false
      }

      isBusy.setBlocking(true)
      try {
        // TODO: This currently throws `WorkletsError: [Worklets] Trying to access property `scheduleOnRuntime` of an object which cannot be sent to the UI runtime.`.
        scheduleOnRuntime(workletRuntime, () => {
          'worklet'
          task()
          isBusy.setBlocking(false)
        })
        return true
      } catch (e) {
        // An error occurred while scheduling - unset blocking & throw!
        isBusy.setBlocking(false)
        // Rethrow!
        throw e
      }
    },
  }
}
