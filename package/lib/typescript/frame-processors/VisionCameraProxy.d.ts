import type { IWorkletContext } from 'react-native-worklets-core';
import type { Frame } from '../types/Frame';
type BasicParameterType = string | number | boolean | undefined | ArrayBuffer;
type ParameterType = BasicParameterType | BasicParameterType[] | Record<string, BasicParameterType | undefined>;
/**
 * An initialized native instance of a FrameProcessorPlugin.
 * All memory allocated by this plugin will be deleted once this value goes out of scope.
 */
export interface FrameProcessorPlugin {
    /**
     * Call the native Frame Processor Plugin with the given Frame and options.
     * @param frame The Frame from the Frame Processor.
     * @param options (optional) Additional options. Options will be converted to a native dictionary
     * @returns (optional) A value returned from the native Frame Processor Plugin (or undefined)
     */
    call(frame: Frame, options?: Record<string, ParameterType>): ParameterType;
}
interface TVisionCameraProxy {
    /**
     * @internal
     */
    setFrameProcessor(viewTag: number, frameProcessor: (frame: Frame) => void): void;
    /**
     * @internal
     */
    removeFrameProcessor(viewTag: number): void;
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
    initFrameProcessorPlugin(name: string, options: Record<string, ParameterType>): FrameProcessorPlugin | undefined;
    /**
     * Get the Frame Processor Runtime Worklet Context.
     *
     * This is the serial [DispatchQueue](https://developer.apple.com/documentation/dispatch/dispatchqueue)
     * / [Executor](https://developer.android.com/reference/java/util/concurrent/Executor) the
     * video/frame processor pipeline is running on.
     *
     * @internal
     */
    workletContext: IWorkletContext | undefined;
}
/**
 * The JSI Proxy for the Frame Processors Runtime.
 *
 * This will be replaced with a CxxTurboModule in the future.
 */
export declare const VisionCameraProxy: TVisionCameraProxy;
export {};
//# sourceMappingURL=VisionCameraProxy.d.ts.map