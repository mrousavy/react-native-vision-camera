"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useCameraDevices = useCameraDevices;
var _react = require("react");
var _CameraDevices = require("../CameraDevices");
/**
 * Get all available Camera Devices this phone has.
 *
 * Camera Devices attached to this phone (`back` or `front`) are always available,
 * while `external` devices might be plugged in or out at any point,
 * so the result of this function might update over time.
 */
function useCameraDevices() {
  const [devices, setDevices] = (0, _react.useState)(() => _CameraDevices.CameraDevices.getAvailableCameraDevices());
  (0, _react.useEffect)(() => {
    const listener = _CameraDevices.CameraDevices.addCameraDevicesChangedListener(newDevices => {
      setDevices(newDevices);
    });
    return () => listener.remove();
  }, []);
  return devices;
}
//# sourceMappingURL=useCameraDevices.js.map