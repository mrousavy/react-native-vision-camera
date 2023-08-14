"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useCameraDevices = useCameraDevices;

var _react = require("react");

var _FormatFilter = require("../utils/FormatFilter");

var _Camera = require("../Camera");

var _CameraDevice = require("../CameraDevice");

const DefaultCameraDevices = {
  back: undefined,
  external: undefined,
  front: undefined,
  unspecified: undefined
};
/**
 * Gets the best available {@linkcode CameraDevice}. Devices with more cameras are preferred.
 *
 * @returns The best matching {@linkcode CameraDevice}.
 * @throws {@linkcode CameraRuntimeError} if no device was found.
 * @example
 * ```tsx
 * const device = useCameraDevice()
 * // ...
 * return <Camera device={device} />
 * ```
 */

function useCameraDevices(deviceType) {
  const [cameraDevices, setCameraDevices] = (0, _react.useState)(DefaultCameraDevices);
  (0, _react.useEffect)(() => {
    let isMounted = true;

    const loadDevice = async () => {
      let devices = await _Camera.Camera.getAvailableCameraDevices();
      if (!isMounted) return;
      devices = devices.sort(_FormatFilter.sortDevices);

      if (deviceType != null) {
        devices = devices.filter(d => {
          const parsedType = (0, _CameraDevice.parsePhysicalDeviceTypes)(d.devices);
          return parsedType === deviceType;
        });
      }

      setCameraDevices({
        back: devices.find(d => d.position === 'back'),
        external: devices.find(d => d.position === 'external'),
        front: devices.find(d => d.position === 'front'),
        unspecified: devices.find(d => d.position === 'unspecified')
      });
    };

    loadDevice();
    return () => {
      isMounted = false;
    };
  }, [deviceType]);
  return cameraDevices;
}
//# sourceMappingURL=useCameraDevices.js.map