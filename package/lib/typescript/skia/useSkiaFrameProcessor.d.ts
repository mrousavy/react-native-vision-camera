import type { Frame } from '../types/Frame';
import type { DependencyList } from 'react';
import type { DrawableFrameProcessor } from '../types/CameraProps';
import type { ISharedValue, IWorkletNativeApi } from 'react-native-worklets-core';
import type { SkCanvas, SkPaint, SkImage, SkSurface } from '@shopify/react-native-skia';
import type { Orientation } from '../types/Orientation';
/**
 * Represents a Camera Frame that can be directly drawn to using Skia.
 *
 * @see {@linkcode useSkiaFrameProcessor}
 * @see {@linkcode render}
 */
export interface DrawableFrame extends Frame, SkCanvas {
    /**
     * Renders the Camera Frame to the Canvas.
     * @param paint An optional Paint object, for example for applying filters/shaders to the Camera Frame.
     */
    render(paint?: SkPaint): void;
    /**
     * A private property that holds the SkImage.
     * @internal
     */
    readonly __skImage: SkImage;
    /**
     * A private method to dispose the internally created Texture after rendering has completed.
     * @internal
     */
    dispose(): void;
}
type ThreadID = ReturnType<IWorkletNativeApi['getCurrentThreadId']>;
type SurfaceCache = Record<ThreadID, {
    surface: SkSurface;
    width: number;
    height: number;
}>;
/**
 * Create a new Frame Processor function which you can pass to the `<Camera>`.
 * (See ["Frame Processors"](https://react-native-vision-camera.com/docs/guides/frame-processors))
 *
 * Make sure to add the `'worklet'` directive to the top of the Frame Processor function, otherwise it will not get compiled into a worklet.
 *
 * Also make sure to memoize the returned object, so that the Camera doesn't reset the Frame Processor Context each time.
 *
 * @worklet
 * @example
 * ```ts
 * const surfaceHolder = Worklets.createSharedValue<SurfaceCache>({})
 * const offscreenTextures = Worklets.createSharedValue<SkImage[]>([])
 * const frameProcessor = createSkiaFrameProcessor((frame) => {
 *   'worklet'
 *   const faces = scanFaces(frame)
 *
 *   frame.render()
 *   for (const face of faces) {
 *     const rect = Skia.XYWHRect(face.x, face.y, face.width, face.height)
 *     frame.drawRect(rect)
 *   }
 * }, surfaceHolder, offscreenTextures)
 * ```
 */
export declare function createSkiaFrameProcessor(frameProcessor: (frame: DrawableFrame) => void, surfaceHolder: ISharedValue<SurfaceCache>, offscreenTextures: ISharedValue<SkImage[]>, previewOrientation: ISharedValue<Orientation>): DrawableFrameProcessor;
/**
 * Returns a memoized Skia Frame Processor function wich you can pass to the `<Camera>`.
 *
 * The Skia Frame Processor alows you to draw ontop of the Frame, and will manage it's internal offscreen Skia Canvas
 * and onscreen Skia preview view.
 *
 * (See ["Frame Processors"](https://react-native-vision-camera.com/docs/guides/frame-processors))
 *
 * Make sure to add the `'worklet'` directive to the top of the Frame Processor function, otherwise it will not get compiled into a worklet.
 *
 * @worklet
 * @param frameProcessor The Frame Processor
 * @param dependencies The React dependencies which will be copied into the VisionCamera JS-Runtime.
 * @returns The memoized Skia Frame Processor.
 * @example
 * ```ts
 * const frameProcessor = useSkiaFrameProcessor((frame) => {
 *   'worklet'
 *   const faces = scanFaces(frame)
 *
 *   frame.render()
 *   for (const face of faces) {
 *     const rect = Skia.XYWHRect(face.x, face.y, face.width, face.height)
 *     frame.drawRect(rect)
 *   }
 * }, [])
 * ```
 */
export declare function useSkiaFrameProcessor(frameProcessor: (frame: DrawableFrame) => void, dependencies: DependencyList): DrawableFrameProcessor;
export {};
//# sourceMappingURL=useSkiaFrameProcessor.d.ts.map