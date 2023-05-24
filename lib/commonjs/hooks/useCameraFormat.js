"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useCameraFormat = useCameraFormat;

var _react = require("react");

var _FormatFilter = require("../utils/FormatFilter");

/**
 * Returns the best format for the given camera device.
 *
 * This function tries to choose a format with the highest possible photo-capture resolution and best matching aspect ratio.
 *
 * @param {CameraDevice} device The Camera Device
 *
 * @returns The best matching format for the given camera device, or `undefined` if the camera device is `undefined`.
 */
function useCameraFormat(device) {
  return (0, _react.useMemo)(() => device === null || device === void 0 ? void 0 : device.formats.sort(_FormatFilter.sortFormats)[0], [device === null || device === void 0 ? void 0 : device.formats]);
}
//# sourceMappingURL=useCameraFormat.js.map