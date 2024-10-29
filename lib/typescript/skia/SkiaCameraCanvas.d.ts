import React from 'react';
import type { ViewProps } from 'react-native';
import type { CameraProps } from '../types/CameraProps';
import type { ISharedValue } from 'react-native-worklets-core';
import type { SkImage } from '@shopify/react-native-skia';
interface SkiaCameraCanvasProps extends ViewProps {
    /**
     * The offscreen textures queue that have been rendered by the Skia Frame Processor.
     *
     * This view will always pop the latest Texture from this queue and render it.
     */
    offscreenTextures: ISharedValue<SkImage[]>;
    /**
     * The resize mode to use for displaying the feed
     */
    resizeMode: CameraProps['resizeMode'];
}
declare function SkiaCameraCanvasImpl({ offscreenTextures, resizeMode, children, ...props }: SkiaCameraCanvasProps): React.ReactElement;
export declare const SkiaCameraCanvas: React.MemoExoticComponent<typeof SkiaCameraCanvasImpl>;
export {};
//# sourceMappingURL=SkiaCameraCanvas.d.ts.map