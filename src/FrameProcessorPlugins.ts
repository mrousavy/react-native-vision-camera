import type { Frame } from './Frame';
import { Camera } from './Camera';

// Install VisionCamera Frame Processor JSI Bindings and Plugins
Camera.installFrameProcessorBindings();

type FrameProcessor = (frame: Frame, ...args: unknown[]) => unknown;
type TFrameProcessorPlugins = Record<string, FrameProcessor>;

function getPluginsProxy(): TFrameProcessorPlugins {
  if (__DEV__) {
    // Proxy to catch dev errors
    return new Proxy({} as TFrameProcessorPlugins, {
      get: (_, name) => {
        const pluginsProxy = global.FrameProcessorPlugins;

        if (pluginsProxy == null) throw new Error('Frame Processor Plugins Proxy is null! Are Frame Processors initialized properly?');

        if (typeof name === 'symbol') return pluginsProxy[name];

        return pluginsProxy[name];

        if (plugin == null)
          throw new Error(`The Frame Processor Plugin "${name}" does not exist! Are you sure you exposed it properly in native code?`);

        return plugin;
      },
    });
  }

  return global.FrameProcessorPlugins as TFrameProcessorPlugins;
}

export const FrameProcessorPlugins = getPluginsProxy();
