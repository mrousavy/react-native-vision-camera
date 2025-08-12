import type { Frame } from 'react-native-vision-camera'
import { VisionCameraProxy } from 'react-native-vision-camera'

const plugin = VisionCameraProxy.initFrameProcessorPlugin('example_plugin', {})

interface Result {
  example_array: (string | number | boolean)[]
  example_array_buffer: ArrayBuffer
  example_str: string
  example_bool: boolean
  example_double: number
}

export function examplePlugin(frame: Frame): Result {
  'worklet'
  
  if (plugin == null) throw new Error('Failed to load Frame Processor Plugin "example_plugin"!')

  // Log more details but directly from the worklet without runOnJS
  console.log(`[ExamplePlugin] Processing frame: ${frame.width}x${frame.height} at ${frame.timestamp}`)

  const result = plugin.call(frame, {
    someString: 'hello from iOS 18!',
    someBoolean: true,
    someNumber: frame.width * frame.height,
    someObject: { test: frame.width, second: 'test' },
    someArray: ['frame processed', frame.height],
  }) as unknown as Result

  // Log the result directly
  console.log(`[ExamplePlugin] Result: ${result.example_str}`)

  return result
}
