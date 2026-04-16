import landingBgFront from '../../../public/img/landing-bg-front.webp'

export const PARALLAX_MAX = 5
export const PARALLAX_IDLE_RAMP_MS = 3000
export const PARALLAX_MOUSE_OVERRIDE_MS = 1200
export const PARALLAX_MULTIPLIER = 25
export const IMAGE_OVERSCAN_PERCENT = 2
export const PARALLAX_SPRING = {
  stiffness: 80,
  damping: 22,
  mass: 0.8,
} as const
export const PARALLAX_IDLE_X = {
  a: { amplitude: 0.85, frequency: 0.42, phase: 0 },
  b: { amplitude: 0.55, frequency: 0.19, phase: 1.2 },
  c: { amplitude: 0.3, frequency: 0.11, phase: 0.4 },
} as const
export const PARALLAX_IDLE_Y = {
  a: { amplitude: 0.7, frequency: 0.33, phase: 0.7 },
  b: { amplitude: 0.45, frequency: 0.17, phase: 2.1 },
  c: { amplitude: 0.25, frequency: 0.09, phase: 1.4 },
} as const
export const LAYER_SPEEDS = {
  back: 0.02,
  front: 0.08,
} as const
export const LAYER_MOVEMENT_MULTIPLIERS = {
  back: 1,
  front: 1,
} as const
export const IMAGE_LAYER_SCALE = 1.05
export const ENTRY_ANIMATION = {
  introDelayMs: 800,
  reticlePulseMs: 375,
  focusDelayMs: 500,
  focusTransitionMs: 650,
  reticleVisibleAfterFocusMs: 200,
} as const
export const FOCUS_TRANSITION = `filter ${ENTRY_ANIMATION.focusTransitionMs}ms cubic-bezier(0.22, 1, 0.36, 1)`
export const FOCUS_HIT_TEST = {
  logoPaddingPx: 24,
  foregroundBoundary: [
    { x: 0, y: 0.43 },
    { x: 0.08, y: 0.45 },
    { x: 0.16, y: 0.49 },
    { x: 0.24, y: 0.56 },
    { x: 0.32, y: 0.65 },
    { x: 0.4, y: 0.74 },
    { x: 0.5, y: 0.79 },
    { x: 0.62, y: 0.81 },
    { x: 0.74, y: 0.81 },
    { x: 0.84, y: 0.8 },
    { x: 0.92, y: 0.79 },
    { x: 1, y: 0.78 },
  ],
} as const
export const INTRO_LOGO_FOCUS_POINT = {
  xRatio: 0.075,
  yRatio: 0.16,
} as const
export const BLUR_AMOUNTS = {
  foreground: {
    back: 12,
    logo: 8,
    front: 0,
  },
  background: {
    back: 0,
    logo: 2,
    front: 24,
  },
  logo: {
    back: 1,
    logo: 0,
    front: 24,
  },
} as const
const FRONT_LAYER_IMAGE_WIDTH =
  typeof landingBgFront.width === 'number' ? landingBgFront.width : 2000
const FRONT_LAYER_IMAGE_HEIGHT =
  typeof landingBgFront.height === 'number' ? landingBgFront.height : 1332
export const FRONT_LAYER_BIAS_START_ASPECT_RATIO =
  FRONT_LAYER_IMAGE_WIDTH / FRONT_LAYER_IMAGE_HEIGHT
export const FRONT_LAYER_BIAS_END_ASPECT_RATIO = 0.5
export const FRONT_LAYER_MIN_OBJECT_POSITION_X_PERCENT = 33
export const FRONT_LAYER_OFFSET_Y_PERCENT = 5
export const LANDING_BG_SIZES = '(max-aspect-ratio: 3/2) 150vh, 100vw'
export const LOGO_SIZE = {
  width: 731,
  height: 71,
} as const
export const FOCUS_RETICLE_SIZE = 16
export const FOCUS_RETICLE_BOX_SIZE = FOCUS_RETICLE_SIZE * 4
export const LANDING_SKIP_INTRO_STORAGE_KEY = 'vc-landing-skip-intro-once'

export type FocusTarget = keyof typeof BLUR_AMOUNTS

export type FocusPosition = {
  xPercent: number
  yPercent: number
}

export type Offset = {
  x: number
  y: number
}

export type Size = {
  width: number
  height: number
}
