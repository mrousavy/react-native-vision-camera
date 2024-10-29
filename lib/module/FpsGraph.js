function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
import React, { useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';
import { View } from 'react-native';
export const MAX_BARS = 30;
const WIDTH = 100;
const HEIGHT = 65;
const BAR_WIDTH = WIDTH / MAX_BARS;
export function FpsGraph({
  averageFpsSamples,
  targetMaxFps,
  style,
  ...props
}) {
  const maxFps = useMemo(() => {
    const currentMaxFps = averageFpsSamples.reduce((prev, curr) => Math.max(prev, curr), 0);
    return Math.max(currentMaxFps, targetMaxFps);
  }, [averageFpsSamples, targetMaxFps]);
  const latestFps = averageFpsSamples[averageFpsSamples.length - 1];
  return /*#__PURE__*/React.createElement(View, _extends({}, props, {
    style: [styles.container, style]
  }), averageFpsSamples.map((fps, index) => {
    let height = fps / maxFps * HEIGHT;
    if (Number.isNaN(height) || height < 0) {
      // clamp to 0 if needed
      height = 0;
    }
    return /*#__PURE__*/React.createElement(View, {
      key: index,
      style: [styles.bar, {
        height: height
      }]
    });
  }), latestFps != null && !Number.isNaN(latestFps) && /*#__PURE__*/React.createElement(View, {
    style: styles.centerContainer
  }, /*#__PURE__*/React.createElement(Text, {
    style: styles.text
  }, Math.round(latestFps), " FPS")));
}
const styles = StyleSheet.create({
  container: {
    width: WIDTH,
    height: HEIGHT,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    borderRadius: 5,
    overflow: 'hidden'
  },
  bar: {
    width: BAR_WIDTH,
    height: 5,
    backgroundColor: 'rgb(243, 74, 77)'
  },
  centerContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center'
  },
  text: {
    position: 'absolute',
    fontWeight: 'bold',
    fontSize: 14,
    color: 'rgb(255, 255, 255)'
  }
});
//# sourceMappingURL=FpsGraph.js.map