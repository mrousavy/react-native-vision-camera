"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useCodeScanner = useCodeScanner;
var _react = require("react");
function useCodeScanner(codeScanner) {
  const {
    onCodeScanned,
    ...codeScannerOptions
  } = codeScanner;

  // Memoize the  function once and use a ref on any identity changes
  const ref = (0, _react.useRef)(onCodeScanned);
  ref.current = onCodeScanned;
  const callback = (0, _react.useCallback)((codes, frame) => {
    ref.current(codes, frame);
  }, []);

  // CodeScanner needs to be memoized so it doesn't trigger a Camera Session re-build
  return (0, _react.useMemo)(() => ({
    ...codeScannerOptions,
    onCodeScanned: callback
  }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [JSON.stringify(codeScannerOptions), callback]);
}
//# sourceMappingURL=useCodeScanner.js.map