function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }
import React, { useCallback, useState } from 'react';
import { ReanimatedProxy } from '../dependencies/ReanimatedProxy';
import { SkiaProxy } from '../dependencies/SkiaProxy';
function SkiaCameraCanvasImpl({
  offscreenTextures,
  resizeMode = 'cover',
  children,
  ...props
}) {
  const texture = ReanimatedProxy.useSharedValue(null);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  ReanimatedProxy.useFrameCallback(() => {
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
  const onLayout = useCallback(({
    nativeEvent: {
      layout
    }
  }) => {
    setWidth(Math.round(layout.width));
    setHeight(Math.round(layout.height));
  }, []);
  return /*#__PURE__*/React.createElement(SkiaProxy.Canvas, _extends({}, props, {
    onLayout: onLayout,
    pointerEvents: "none"
  }), children, /*#__PURE__*/React.createElement(SkiaProxy.Image, {
    x: 0,
    y: 0,
    width: width,
    height: height,
    fit: resizeMode,
    image: texture
  }));
}
export const SkiaCameraCanvas = /*#__PURE__*/React.memo(SkiaCameraCanvasImpl);
//# sourceMappingURL=SkiaCameraCanvas.js.map