import type { Frame } from 'react-native-vision-camera'
import { initFrameProcessorPlugin } from 'react-native-vision-camera'

const plugin = initFrameProcessorPlugin('example_kotlin_swift_plugin', { foo: 'bar' })

export function exampleKotlinSwiftPlugin(frame: Frame): string[] {
  'worklet'

  if (plugin == null) throw new Error('Failed to load Frame Processor Plugin "example_kotlin_swift_plugin"!')

  return plugin.call(frame, {
    someString: 'hello!',
    someBoolean: true,
    someNumber: 42,
    someObject: { test: 0, second: 'test' },
    someArray: ['another test', 5],
  }) as string[]
}
