import type { Frame } from 'react-native-vision-camera'
import { VisionCameraProxy } from 'react-native-vision-camera'

// Define the return type to match the Swift implementation
interface KotlinSwiftPluginResult {
  example_str: string
  example_bool: boolean
  example_double: number
  example_array: (string | boolean | number)[]
}

const plugin = VisionCameraProxy.initFrameProcessorPlugin('example_kotlin_swift_plugin', { foo: 'bar' })

export function exampleKotlinSwiftPlugin(frame: Frame): KotlinSwiftPluginResult {
  'worklet'

  if (plugin == null) throw new Error('Failed to load Frame Processor Plugin "example_kotlin_swift_plugin"!')

  // Log frame details directly from the worklet
  console.log(`[KotlinSwiftPlugin] Processing frame: ${frame.width}x${frame.height}`)

  // Cast to unknown first, then to our specific interface type
  const result = plugin.call(frame, {
    someString: 'hello from KotlinSwiftPlugin!',
    someBoolean: true,
    someNumber: frame.height,
    someObject: { test: 1, second: 'test' },
    someArray: ['kotlin-swift', frame.width],
  }) as unknown as KotlinSwiftPluginResult
  
  // Log the result
  console.log(`[KotlinSwiftPlugin] Result: ${result.example_str}`)
  
  return result
}
