"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FpsGraph = FpsGraph;
exports.MAX_BARS = void 0;
var _react = _interopRequireWildcard(require("react"));
var _reactNative = require("react-native");
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const MAX_BARS = exports.MAX_BARS = 30;
const WIDTH = 100;
const HEIGHT = 65;
const BAR_WIDTH = WIDTH / MAX_BARS;
function FpsGraph({
  averageFpsSamples,
  targetMaxFps,
  style,
  ...props
}) {
  const maxFps = (0, _react.useMemo)(() => {
    const currentMaxFps = averageFpsSamples.reduce((prev, curr) => Math.max(prev, curr), 0);
    return Math.max(currentMaxFps, targetMaxFps);
  }, [averageFpsSamples, targetMaxFps]);
  const latestFps = averageFpsSamples[averageFpsSamples.length - 1];
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, _extends({}, props, {
    style: [styles.container, style]
  }), averageFpsSamples.map((fps, index) => {
    let height = fps / maxFps * HEIGHT;
    if (Number.isNaN(height) || height < 0) {
      // clamp to 0 if needed
      height = 0;
    }
    return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      key: index,
      style: [styles.bar, {
        height: height
      }]
    });
  }), latestFps != null && !Number.isNaN(latestFps) && /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.centerContainer
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.text
  }, Math.round(latestFps), " FPS")));
}
const styles = _reactNative.StyleSheet.create({
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
    ..._reactNative.StyleSheet.absoluteFillObject,
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