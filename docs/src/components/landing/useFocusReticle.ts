'use client'

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import {
  BLUR_AMOUNTS,
  ENTRY_ANIMATION,
  type FocusPosition,
  type FocusTarget,
} from '@/components/landing/constants'
import { readAndClearSkipIntroOnNextLandingVisit } from '@/components/landing/storage'

export function useFocusReticle(
  getIntroLogoFocusPosition: () => FocusPosition,
) {
  const focusTimeoutsRef = useRef<number[]>([])
  const [focusTarget, setFocusTarget] = useState<FocusTarget>('foreground')
  const [shouldPlayIntro, setShouldPlayIntro] = useState(false)
  const [isReticleVisible, setIsReticleVisible] = useState(false)
  const [isReticlePulsing, setIsReticlePulsing] = useState(false)
  const [reticlePosition, setReticlePosition] = useState<FocusPosition>({
    xPercent: 50,
    yPercent: 50,
  })

  const clearFocusTimeouts = useCallback(() => {
    focusTimeoutsRef.current.forEach((timeoutId) => {
      window.clearTimeout(timeoutId)
    })
    focusTimeoutsRef.current = []
  }, [])

  const triggerFocus = useCallback(
    (target: FocusTarget, position: FocusPosition, introDelayMs = 0) => {
      clearFocusTimeouts()

      focusTimeoutsRef.current = [
        window.setTimeout(() => {
          setReticlePosition(position)
          setIsReticleVisible(true)
          setIsReticlePulsing(true)
        }, introDelayMs),
        window.setTimeout(() => {
          setIsReticlePulsing(false)
        }, introDelayMs + ENTRY_ANIMATION.reticlePulseMs),
        window.setTimeout(() => {
          setFocusTarget(target)
        }, introDelayMs + ENTRY_ANIMATION.focusDelayMs),
        window.setTimeout(
          () => {
            setIsReticleVisible(false)
          },
          introDelayMs +
            ENTRY_ANIMATION.focusDelayMs +
            ENTRY_ANIMATION.focusTransitionMs +
            ENTRY_ANIMATION.reticleVisibleAfterFocusMs,
        ),
      ]
    },
    [clearFocusTimeouts],
  )

  useLayoutEffect(() => {
    if (!readAndClearSkipIntroOnNextLandingVisit()) {
      setShouldPlayIntro(true)
      return
    }

    clearFocusTimeouts()
    setFocusTarget('logo')
    setIsReticleVisible(false)
    setIsReticlePulsing(false)
    setShouldPlayIntro(false)
  }, [clearFocusTimeouts])

  useEffect(() => {
    if (!shouldPlayIntro) {
      return
    }

    const introTimeout = window.setTimeout(() => {
      triggerFocus('logo', getIntroLogoFocusPosition())
    }, ENTRY_ANIMATION.introDelayMs)

    return () => {
      window.clearTimeout(introTimeout)
      clearFocusTimeouts()
    }
  }, [
    clearFocusTimeouts,
    getIntroLogoFocusPosition,
    shouldPlayIntro,
    triggerFocus,
  ])

  return {
    blurAmounts: BLUR_AMOUNTS[focusTarget],
    focusTarget,
    isReticlePulsing,
    isReticleVisible,
    reticlePosition,
    triggerFocus,
  }
}
