import { describe, expect, it } from 'react-native-harness'
import type { CameraOrientation } from 'react-native-vision-camera'
import { getUIRotation } from 'react-native-vision-camera'

describe('VisionCamera - Utils', () => {
  it('calculates UI rotation for every output and interface orientation', () => {
    const expectedRotations = [
      { output: 'up', interface: 'up', rotation: 0 },
      { output: 'up', interface: 'right', rotation: 90 },
      { output: 'up', interface: 'down', rotation: 180 },
      { output: 'up', interface: 'left', rotation: -90 },
      { output: 'right', interface: 'up', rotation: -90 },
      { output: 'right', interface: 'right', rotation: 0 },
      { output: 'right', interface: 'down', rotation: 90 },
      { output: 'right', interface: 'left', rotation: 180 },
      { output: 'down', interface: 'up', rotation: 180 },
      { output: 'down', interface: 'right', rotation: -90 },
      { output: 'down', interface: 'down', rotation: 0 },
      { output: 'down', interface: 'left', rotation: 90 },
      { output: 'left', interface: 'up', rotation: 90 },
      { output: 'left', interface: 'right', rotation: 180 },
      { output: 'left', interface: 'down', rotation: -90 },
      { output: 'left', interface: 'left', rotation: 0 },
    ] satisfies {
      output: CameraOrientation
      interface: CameraOrientation
      rotation: number
    }[]

    const reportedRotations = expectedRotations.map(
      ({ output, interface: interfaceOrientation }) => ({
        output,
        interface: interfaceOrientation,
        rotation: getUIRotation(output, interfaceOrientation),
      }),
    )

    expect(reportedRotations).toEqual(expectedRotations)
  })
})
