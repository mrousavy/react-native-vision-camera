import React from 'react';
import type { ViewProps } from 'react-native';
interface Props extends ViewProps {
    /**
     * The current average FPS samples over time. One sample should be 1 second
     */
    averageFpsSamples: number[];
    /**
     * The target FPS rate
     */
    targetMaxFps: number;
}
export declare const MAX_BARS = 30;
export declare function FpsGraph({ averageFpsSamples, targetMaxFps, style, ...props }: Props): React.ReactElement;
export {};
//# sourceMappingURL=FpsGraph.d.ts.map