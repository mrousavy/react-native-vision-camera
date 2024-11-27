import { useCallback, useMemo, useRef } from 'react';
export function useCodeScanner(codeScanner) {
  const {
    onCodeScanned,
    ...codeScannerOptions
  } = codeScanner;

  // Memoize the  function once and use a ref on any identity changes
  const ref = useRef(onCodeScanned);
  ref.current = onCodeScanned;
  const callback = useCallback((codes, frame) => {
    ref.current(codes, frame);
  }, []);

  // CodeScanner needs to be memoized so it doesn't trigger a Camera Session re-build
  return useMemo(() => ({
    ...codeScannerOptions,
    onCodeScanned: callback
  }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [JSON.stringify(codeScannerOptions), callback]);
}
//# sourceMappingURL=useCodeScanner.js.map