"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createFrameProcessor = createFrameProcessor;
exports.useFrameProcessor = useFrameProcessor;
var _react = require("react");
var _withFrameRefCounting = require("../frame-processors/withFrameRefCounting");
/**
 * Create a new Frame Processor function which you can pass to the `<Camera>`.
 * (See ["Frame Processors"](https://react-native-vision-camera.com/docs/guides/frame-processors))
 *
 * Make sure to add the `'worklet'` directive to the top of the Frame Processor function, otherwise it will not get compiled into a worklet.
 *
 * Also make sure to memoize the returned object, so that the Camera doesn't reset the Frame Processor Context each time.
 * @worklet
 */
function createFrameProcessor(frameProcessor) {
  return {
    frameProcessor: (0, _withFrameRefCounting.withFrameRefCounting)(frameProcessor),
    type: 'readonly'
  };
}

/**
 * Returns a memoized Frame Processor function wich you can pass to the `<Camera>`.
 * (See ["Frame Processors"](https://react-native-vision-camera.com/docs/guides/frame-processors))
 *
 * Make sure to add the `'worklet'` directive to the top of the Frame Processor function, otherwise it will not get compiled into a worklet.
 *
 * @worklet
 * @param frameProcessor The Frame Processor
 * @param dependencies The React dependencies which will be copied into the VisionCamera JS-Runtime.
 * @returns The memoized Frame Processor.
 * @example
 * ```ts
 * const frameProcessor = useFrameProcessor((frame) => {
 *   'worklet'
 *   const faces = scanFaces(frame)
 *   console.log(`Faces: ${faces}`)
 * }, [])
 * ```
 */
function useFrameProcessor(frameProcessor, dependencies) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return (0, _react.useMemo)(() => createFrameProcessor(frameProcessor), dependencies);
}
//# sourceMappingURL=useFrameProcessor.js.map