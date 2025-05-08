import type { SkPaint } from '@shopify/react-native-skia'
import { Skia, TileMode } from '@shopify/react-native-skia'
import { useMemo } from 'react'
import { shaderBuilder } from '../assets/shaders'

export function useGrainyBlurShader(): SkPaint {
  const blur = 60
  const noiseStrength = 0.15
  const saturation = 1.4

  return useMemo(() => {
    shaderBuilder.setUniform('noiseStrength', [noiseStrength]) // Set the noise strength
    shaderBuilder.setUniform('saturation', [saturation]) // Set the saturation factor

    const blurFilter = Skia.ImageFilter.MakeBlur(blur, blur, TileMode.Mirror, null)
    const grainyBlurFilter = Skia.ImageFilter.MakeRuntimeShader(shaderBuilder, null, blurFilter)

    const paint = Skia.Paint()
    paint.setImageFilter(grainyBlurFilter)

    return paint
  }, [blur, noiseStrength, saturation])
}
