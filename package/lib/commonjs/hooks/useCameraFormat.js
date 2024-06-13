"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useCameraFormat = useCameraFormat;
var _react = require("react");
var _getCameraFormat = require("../devices/getCameraFormat");
/**
 * Get the best matching Camera format for the given device that satisfies your requirements using a sorting filter. By default, formats are sorted by highest to lowest resolution.
 *
 * The {@linkcode filters | filters} are ranked by priority, from highest to lowest.
 * This means the first item you pass will have a higher priority than the second, and so on.
 *
 * @param device The Camera Device you're currently using
 * @param filters The filters you want to use. The format that matches your filter the closest will be returned
 * @returns The format that matches your filter the closest.
 * @example
 * ```ts
 * const device = useCameraDevice(...)
 * const format = useCameraFormat(device, [
 *   { videoResolution: { width: 3048, height: 2160 } },
 *   { fps: 60 }
 * ])
 * ```
 */
function useCameraFormat(device, filters) {
  const format = (0, _react.useMemo)(() => {
    if (device == null) return undefined;
    return (0, _getCameraFormat.getCameraFormat)(device, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [device, JSON.stringify(filters)]);
  return format;
}
//# sourceMappingURL=useCameraFormat.js.map