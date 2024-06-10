import React, { useCallback, useState } from 'react'
import type { LayoutChangeEvent, ViewProps } from 'react-native'
import type { CameraProps } from '../types/CameraProps'
import type { ISharedValue } from 'react-native-worklets-core'
import type { SkImage } from '@shopify/react-native-skia'
import { ReanimatedProxy } from '../dependencies/ReanimatedProxy'
import { SkiaProxy } from '../dependencies/SkiaProxy'

interface SkiaCameraCanvasProps extends ViewProps {
  /**
   * The offscreen textures queue that have been rendered by the Skia Frame Processor.
   *
   * This view will always pop the latest Texture from this queue and render it.
   */
  offscreenTextures: ISharedValue<SkImage[]>
  /**
   * The resize mode to use for displaying the feed
   */
  resizeMode: CameraProps['resizeMode']
}

function SkiaCameraCanvasImpl({ offscreenTextures, resizeMode = 'cover', children, ...props }: SkiaCameraCanvasProps): React.ReactElement {
  const texture = ReanimatedProxy.useSharedValue<SkImage | null>(null)
  const [width, setWidth] = useState(0)
  const [height, setHeight] = useState(0)

  ReanimatedProxy.useFrameCallback(() => {
    'worklet'

    // 1. atomically pop() the latest rendered frame/texture from our queue
    const latestTexture = offscreenTextures.value.pop()
    if (latestTexture == null) {
      // we don't have a new Frame from the Camera yet, skip this render.
      return
    }

    // 2. dispose the last rendered frame
    texture.value?.dispose()

    // 3. set a new one which will be rendered then
    texture.value = latestTexture
  })

  const onLayout = useCallback(({ nativeEvent: { layout } }: LayoutChangeEvent) => {
    setWidth(Math.round(layout.width))
    setHeight(Math.round(layout.height))
  }, [])

  return (
    <SkiaProxy.Canvas {...props} onLayout={onLayout} pointerEvents="none">
      {children}
      <SkiaProxy.Image x={0} y={0} width={width} height={height} fit={resizeMode} image={texture} />
    </SkiaProxy.Canvas>
  )
}

export const SkiaCameraCanvas = React.memo(SkiaCameraCanvasImpl)
