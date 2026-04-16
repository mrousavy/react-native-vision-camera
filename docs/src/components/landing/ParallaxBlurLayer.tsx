import type { MotionValue } from 'motion/react'
import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import {
  FOCUS_TRANSITION,
  IMAGE_OVERSCAN_PERCENT,
} from '@/components/landing/constants'

type ParallaxBlurLayerProps = {
  blurAmount: number
  children: ReactNode
  x: MotionValue<number>
  y: MotionValue<number>
  zIndexClassName: string
}

export function ParallaxBlurLayer({
  blurAmount,
  children,
  x,
  y,
  zIndexClassName,
}: ParallaxBlurLayerProps) {
  return (
    <motion.div
      className={`vc-landing-parallax-layer pointer-events-none absolute ${zIndexClassName}`}
      style={{
        top: `-${IMAGE_OVERSCAN_PERCENT}%`,
        right: `-${IMAGE_OVERSCAN_PERCENT}%`,
        bottom: `-${IMAGE_OVERSCAN_PERCENT}%`,
        left: `-${IMAGE_OVERSCAN_PERCENT}%`,
        x,
        y,
      }}
    >
      <div
        className="h-full w-full"
        style={{
          filter: `blur(${blurAmount}px)`,
          transition: FOCUS_TRANSITION,
        }}
      >
        {children}
      </div>
    </motion.div>
  )
}
