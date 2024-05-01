import { VisionCameraProxy } from './VisionCameraProxy'

/**
 * Creates a new instance of a native Frame Processor Plugin.
 * The Plugin has to be registered on the native side, otherwise this returns `undefined`.
 * @param name The name of the Frame Processor Plugin. This has to be the same name as on the native side.
 * @param options (optional) Options, as a native dictionary, passed to the constructor/init-function of the native plugin.
 * @example
 * ```ts
 * const plugin = VisionCameraProxy.initFrameProcessorPlugin('scanFaces', { model: 'fast' })
 * if (plugin == null) throw new Error("Failed to load scanFaces plugin!")
 * ```
 */
export const initFrameProcessorPlugin = VisionCameraProxy.initFrameProcessorPlugin
