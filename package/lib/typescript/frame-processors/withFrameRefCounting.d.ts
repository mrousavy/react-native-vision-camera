import type { Frame } from '../types/Frame';
/**
 * A private API to wrap a Frame Processor with a ref-counting mechanism
 * @worklet
 * @internal
 */
export declare function withFrameRefCounting(frameProcessor: (frame: Frame) => void): (frame: Frame) => void;
//# sourceMappingURL=withFrameRefCounting.d.ts.map