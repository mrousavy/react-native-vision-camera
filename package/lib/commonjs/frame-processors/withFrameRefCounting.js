"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.withFrameRefCounting = withFrameRefCounting;
var _throwErrorOnJS = require("./throwErrorOnJS");
/**
 * A private API to wrap a Frame Processor with a ref-counting mechanism
 * @worklet
 * @internal
 */
function withFrameRefCounting(frameProcessor) {
  return frame => {
    'worklet';

    // Increment ref-count by one
    const internal = frame;
    internal.incrementRefCount();
    try {
      // Call sync frame processor
      frameProcessor(frame);
    } catch (e) {
      // Re-throw error on JS Thread
      (0, _throwErrorOnJS.throwErrorOnJS)(e);
    } finally {
      // Potentially delete Frame if we were the last ref (no runAsync)
      internal.decrementRefCount();
    }
  };
}
//# sourceMappingURL=withFrameRefCounting.js.map