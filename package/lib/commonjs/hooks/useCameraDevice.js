"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useCameraDevice = useCameraDevice;
var _react = require("react");
var _getCameraDevice = require("../devices/getCameraDevice");
var _useCameraDevices = require("./useCameraDevices");
/**
 * Get the best matching Camera device that best satisfies your requirements using a sorting filter.
 * @param position The position of the Camera device relative to the phone.
 * @param filter The filter you want to use. The Camera device that matches your filter the closest will be returned
 * @returns The Camera device that matches your filter the closest, or `undefined` if no such Camera Device exists on the given {@linkcode position}.
 * @example
 * ```ts
 * const device = useCameraDevice('back', {
 *    physicalDevices: ['wide-angle-camera']
 * })
 * ```
 */
function useCameraDevice(position, filter) {
  const devices = (0, _useCameraDevices.useCameraDevices)();
  const device = (0, _react.useMemo)(() => (0, _getCameraDevice.getCameraDevice)(devices, position, filter),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [devices, position, JSON.stringify(filter)]);
  return device;
}
//# sourceMappingURL=useCameraDevice.js.map