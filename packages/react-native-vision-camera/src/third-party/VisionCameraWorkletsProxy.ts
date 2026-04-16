import type { RuntimeThreadProvider } from '../threading/RuntimeThreadProvider'

// TODO: The worklets implementation (`VisionCameraWorkletsProxy`) is kinda loosely coupled here, and untyped.
//       Maybe it is worth considering renaming `react-native-vision-camera-worklets` to
//       `react-native-vision-camera-frame-processors` and this package then contains `useFrameOutput(..)` or
//       `AsyncRunner`?

function isRuntimeThreadProvider(
  object: unknown,
): object is RuntimeThreadProvider {
  if (object == null || typeof object !== 'object') return false
  return (
    Object.hasOwn(object, 'createAsyncRunner') &&
    Object.hasOwn(object, 'createRuntimeForThread')
  )
}

let _provider: RuntimeThreadProvider | undefined
function getProvider(): RuntimeThreadProvider {
  if (_provider == null) {
    try {
      const module = require('react-native-vision-camera-worklets')
      const provider = module.provider as unknown
      if (!isRuntimeThreadProvider(provider)) {
        throw new Error(
          'The module `react-native-vision-camera-worklets` does not export a `provider: RuntimeThreadProvider`!',
        )
      }
      _provider = provider
    } catch {
      throw new Error(
        'Cannot use Frame Processors - `react-native-vision-camera-worklets` is not installed!',
      )
    }
  }
  return _provider
}

/**
 * A lazily-loaded {@linkcode RuntimeThreadProvider} backed by
 * `react-native-vision-camera-worklets`.
 *
 * If react-native-vision-camera-worklets is not installed, accessing anything
 * on {@linkcode VisionCameraWorkletsProxy} will throw.
 */
export const VisionCameraWorkletsProxy: RuntimeThreadProvider = {
  createAsyncRunner: () => getProvider().createAsyncRunner(),
  createRuntimeForThread: (thread) =>
    getProvider().createRuntimeForThread(thread),
  bindUIUpdatesToController: (value, controller, funcName) =>
    getProvider().bindUIUpdatesToController(value, controller, funcName),
}
