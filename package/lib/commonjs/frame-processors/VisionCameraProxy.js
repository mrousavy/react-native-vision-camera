"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.VisionCameraProxy = void 0;
var _NativeCameraModule = require("../NativeCameraModule");
var _FrameProcessorsUnavailableError = require("./FrameProcessorsUnavailableError");
/**
 * An initialized native instance of a FrameProcessorPlugin.
 * All memory allocated by this plugin will be deleted once this value goes out of scope.
 */

let proxy;
try {
  // 1. Load react-native-worklets-core
  require('react-native-worklets-core');
  // 2. If react-native-worklets-core could be loaded, try to install Frame Processor bindings
  const result = _NativeCameraModule.CameraModule.installFrameProcessorBindings();
  if (result !== true) throw new Error(`Failed to install Frame Processor JSI bindings! installFrameProcessorBindings() returned ${result}`);

  // 3. Get global.VisionCameraProxy which was just installed by installFrameProcessorBindings()
  // @ts-expect-error it's a global JSI variable injected by native
  const globalProxy = global.VisionCameraProxy;
  if (globalProxy == null) throw new Error('global.VisionCameraProxy is not installed! Was installFrameProcessorBindings() called?');
  proxy = globalProxy;
} catch (e) {
  // global.VisionCameraProxy is not injected!
  // Just use dummy implementations that will throw when the user tries to use Frame Processors.
  proxy = {
    initFrameProcessorPlugin: () => {
      throw new _FrameProcessorsUnavailableError.FrameProcessorsUnavailableError(e);
    },
    removeFrameProcessor: () => {
      throw new _FrameProcessorsUnavailableError.FrameProcessorsUnavailableError(e);
    },
    setFrameProcessor: () => {
      throw new _FrameProcessorsUnavailableError.FrameProcessorsUnavailableError(e);
    },
    workletContext: undefined
  };
}

/**
 * The JSI Proxy for the Frame Processors Runtime.
 *
 * This will be replaced with a CxxTurboModule in the future.
 */
const VisionCameraProxy = exports.VisionCameraProxy = proxy;
//# sourceMappingURL=VisionCameraProxy.js.map