import { VisionCameraProxy, Frame } from 'react-native-vision-camera'

const plugin = VisionCameraProxy.getFrameProcessorPlugin('example_plugin')

interface Result {
  example_array: (string | number | boolean)[]
  example_str: string
  example_bool: boolean
  example_double: number
}

export function examplePlugin(frame: Frame): Result {
  'worklet'

  if (plugin == null) throw new Error('Failed to load Frame Processor Plugin "example_plugin"!')

  return plugin.call(frame, {
    someString: 'hello!',
    someBoolean: true,
    someNumber: 42,
    someObject: { test: 0, second: 'test' },
    someArray: ['another test', 5],
  }) as unknown as Result
}
