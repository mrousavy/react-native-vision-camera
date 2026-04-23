import type { RuntimeThreadProvider } from 'react-native-vision-camera'
import { scheduleOnRuntime, scheduleOnUI } from 'react-native-worklets'
import { createAsyncRunner } from './createAsyncRunner'
import { createWorkletRuntimeForThread } from './createWorkletRuntimeForThread'

let listenerId = 62765

/**
 * Creates the default {@linkcode RuntimeThreadProvider} implementation that
 * bridges `react-native-vision-camera` with
 * [react-native-worklets](https://docs.swmansion.com/react-native-worklets/docs/).
 *
 * `react-native-vision-camera` lazily requires this provider through its module
 * proxy, so installing `react-native-vision-camera-worklets` is usually all that
 * is needed to enable Worklet-based Frame Processors.
 *
 * @see {@linkcode RuntimeThreadProvider}
 */
export function createRuntimeThreadProvider(): RuntimeThreadProvider {
  return {
    createAsyncRunner() {
      return createAsyncRunner()
    },
    createRuntimeForThread(thread) {
      const runtime = createWorkletRuntimeForThread(thread)
      return {
        setOnDepthFrameCallback(depthOutput, onDepth) {
          if (onDepth != null) {
            scheduleOnRuntime(runtime, () => {
              'worklet'
              depthOutput.setOnDepthFrameCallback((depth) => {
                try {
                  onDepth(depth)
                } catch (e) {
                  const message =
                    typeof e === 'object' && e != null && 'message' in e
                      ? String(e.message)
                      : `${e}`
                  console.error(message, e)
                }
                return true
              })
            })
          } else {
            depthOutput.setOnDepthFrameCallback(undefined)
          }
        },
        setOnFrameCallback(frameOutput, onFrame) {
          if (onFrame != null) {
            scheduleOnRuntime(runtime, () => {
              'worklet'
              frameOutput.setOnFrameCallback((frame) => {
                try {
                  onFrame(frame)
                } catch (e) {
                  const message =
                    typeof e === 'object' && e != null && 'message' in e
                      ? String(e.message)
                      : `${e}`
                  console.error(message, e)
                }
                return true
              })
            })
          } else {
            frameOutput.setOnFrameCallback(undefined)
          }
        },
      }
    },
    bindUIUpdatesToController(value, controller, funcName) {
      const id = listenerId++
      scheduleOnUI(() => {
        'worklet'
        value.addListener(id, (v) => {
          controller[funcName](v)
        })
      })
      return {
        remove() {
          scheduleOnUI(() => {
            'worklet'
            value.removeListener(id)
          })
        },
      }
    },
  }
}
