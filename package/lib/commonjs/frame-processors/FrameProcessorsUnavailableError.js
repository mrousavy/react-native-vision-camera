"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FrameProcessorsUnavailableError = void 0;
var _CameraError = require("../CameraError");
class FrameProcessorsUnavailableError extends _CameraError.CameraRuntimeError {
  constructor(reason) {
    super('system/frame-processors-unavailable', 'Frame Processors are not available, react-native-worklets-core is not installed! ' + `Error: ${reason instanceof Error ? reason.message : reason}`);
  }
}
exports.FrameProcessorsUnavailableError = FrameProcessorsUnavailableError;
//# sourceMappingURL=FrameProcessorsUnavailableError.js.map