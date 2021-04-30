import { DependencyList, useCallback } from 'react';
import type { Frame } from 'src/Frame';

export function useFrameProcessor(frameProcessor: (frame: Frame) => void, dependencies: DependencyList): (frame: Frame) => void {
  return useCallback((frame: Frame) => {
    'worklet';
    return frameProcessor(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
}
