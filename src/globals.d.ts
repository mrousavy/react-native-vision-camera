/* eslint-disable no-var */

/**
 * The global Frame Processor plugins registry - will be initialized after the `installFrameProcessorBindings()` call
 */
declare var FrameProcessorPlugins: Record<string | symbol, unknown> | undefined;
