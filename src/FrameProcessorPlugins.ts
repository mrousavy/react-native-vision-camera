import type { Frame } from './Frame';
import { Camera } from './Camera';

// Install VisionCamera Frame Processor JSI Bindings and Plugins
Camera.installFrameProcessorBindings();

type FrameProcessor = (frame: Frame, ...args: unknown[]) => unknown;
type TFrameProcessorPlugins = Record<string, FrameProcessor>;

/**
 * All natively installed Frame Processor Plugins.
 */
export const FrameProcessorPlugins = global.FrameProcessorPlugins as TFrameProcessorPlugins;
