import type { ListenerSubscription } from '../common-types/ListenerSubscription'
import type { CameraSessionOutput } from './CameraSessionOutput.nitro'
import type { Frame } from '../Frame.nitro'

export interface CameraSessionFrameOutput extends CameraSessionOutput {
  addOnFrameListener(listener: (frame: Frame) => void): ListenerSubscription
}
