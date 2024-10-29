"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SkiaCameraCanvas = void 0;
var _react = _interopRequireWildcard(require("react"));
var _ReanimatedProxy = require("../dependencies/ReanimatedProxy");
var _SkiaProxy = require("../dependencies/SkiaProxy");
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function SkiaCameraCanvasImpl({
  offscreenTextures,
  resizeMode = 'cover',
  children,
  ...props
}) {
  const texture = _ReanimatedProxy.ReanimatedProxy.useSharedValue(null);
  const [width, setWidth] = (0, _react.useState)(0);
  const [height, setHeight] = (0, _react.useState)(0);
  _ReanimatedProxy.ReanimatedProxy.useFrameCallback(() => {
    'worklet';

    // 1. atomically pop() the latest rendered frame/texture from our queue
    const latestTexture = offscreenTextures.value.pop();
    if (latestTexture == null) {
      // we don't have a new Frame from the Camera yet, skip this render.
      return;
    }

    // 2. dispose the last rendered frame
    texture.value?.dispose();

    // 3. set a new one which will be rendered then
    texture.value = latestTexture;
  });
  const onLayout = (0, _react.useCallback)(({
    nativeEvent: {
      layout
    }
  }) => {
    setWidth(Math.round(layout.width));
    setHeight(Math.round(layout.height));
  }, []);
  return /*#__PURE__*/_react.default.createElement(_SkiaProxy.SkiaProxy.Canvas, _extends({}, props, {
    onLayout: onLayout,
    pointerEvents: "none"
  }), children, /*#__PURE__*/_react.default.createElement(_SkiaProxy.SkiaProxy.Image, {
    x: 0,
    y: 0,
    width: width,
    height: height,
    fit: resizeMode,
    image: texture
  }));
}
const SkiaCameraCanvas = exports.SkiaCameraCanvas = /*#__PURE__*/_react.default.memo(SkiaCameraCanvasImpl);
//# sourceMappingURL=SkiaCameraCanvas.js.map