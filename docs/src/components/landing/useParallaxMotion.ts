'use client'

import { useMotionValue, useSpring } from 'motion/react'
import { type RefObject, useEffect, useRef, useState } from 'react'
import {
  LAYER_MOVEMENT_MULTIPLIERS,
  LAYER_SPEEDS,
  PARALLAX_IDLE_RAMP_MS,
  PARALLAX_IDLE_X,
  PARALLAX_IDLE_Y,
  PARALLAX_MAX,
  PARALLAX_MOUSE_OVERRIDE_MS,
  PARALLAX_MULTIPLIER,
  PARALLAX_SPRING,
  type Size,
} from '@/components/landing/constants'
import { clamp, easeInOutSine } from '@/components/landing/geometry'

export function useParallaxMotion(
  containerRef: RefObject<HTMLDivElement | null>,
) {
  const mouseRef = useRef({ x: 0, y: 0 })
  const mouseLastMovedAtRef = useRef(0)
  const idleRef = useRef({
    startTime: 0,
  })
  const [containerSize, setContainerSize] = useState<Size | null>(null)
  const backXTarget = useMotionValue(0)
  const backYTarget = useMotionValue(0)
  const frontXTarget = useMotionValue(0)
  const frontYTarget = useMotionValue(0)

  const backX = useSpring(backXTarget, PARALLAX_SPRING)
  const backY = useSpring(backYTarget, PARALLAX_SPRING)
  const frontX = useSpring(frontXTarget, PARALLAX_SPRING)
  const frontY = useSpring(frontYTarget, PARALLAX_SPRING)

  useEffect(() => {
    const container = containerRef.current
    if (container == null) {
      return
    }

    const updateSize = (width: number, height: number) => {
      setContainerSize((current) => {
        if (current?.width === width && current.height === height) {
          return current
        }

        return { width, height }
      })
    }

    const rect = container.getBoundingClientRect()
    updateSize(rect.width, rect.height)

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry == null) {
        return
      }

      updateSize(entry.contentRect.width, entry.contentRect.height)
    })

    observer.observe(container)

    return () => {
      observer.disconnect()
    }
  }, [containerRef])

  useEffect(() => {
    const container = containerRef.current
    if (container == null) {
      return
    }

    let rafId: number | null = null
    let pausedAt: number | null = null

    const animate = (now: number) => {
      const idle = idleRef.current
      const elapsedMs = now - idle.startTime
      const elapsedSeconds = elapsedMs / 1000

      const rampUp = easeInOutSine(
        Math.min(elapsedMs / PARALLAX_IDLE_RAMP_MS, 1),
      )

      const idleX =
        (Math.sin(
          elapsedSeconds * PARALLAX_IDLE_X.a.frequency +
            PARALLAX_IDLE_X.a.phase,
        ) *
          PARALLAX_IDLE_X.a.amplitude +
          Math.sin(
            elapsedSeconds * PARALLAX_IDLE_X.b.frequency +
              PARALLAX_IDLE_X.b.phase,
          ) *
            PARALLAX_IDLE_X.b.amplitude +
          Math.cos(
            elapsedSeconds * PARALLAX_IDLE_X.c.frequency +
              PARALLAX_IDLE_X.c.phase,
          ) *
            PARALLAX_IDLE_X.c.amplitude) *
        rampUp

      const idleY =
        (Math.cos(
          elapsedSeconds * PARALLAX_IDLE_Y.a.frequency +
            PARALLAX_IDLE_Y.a.phase,
        ) *
          PARALLAX_IDLE_Y.a.amplitude +
          Math.sin(
            elapsedSeconds * PARALLAX_IDLE_Y.b.frequency +
              PARALLAX_IDLE_Y.b.phase,
          ) *
            PARALLAX_IDLE_Y.b.amplitude +
          Math.cos(
            elapsedSeconds * PARALLAX_IDLE_Y.c.frequency +
              PARALLAX_IDLE_Y.c.phase,
          ) *
            PARALLAX_IDLE_Y.c.amplitude) *
        rampUp

      const msSinceMouseMove = now - mouseLastMovedAtRef.current
      const blend =
        mouseLastMovedAtRef.current === 0
          ? 0
          : Math.max(0, 1 - msSinceMouseMove / PARALLAX_MOUSE_OVERRIDE_MS)
      const mouse = mouseRef.current

      const combinedX = idleX * (1 - blend) + mouse.x * blend
      const combinedY = idleY * (1 - blend) + mouse.y * blend

      backXTarget.set(
        clamp(
          combinedX *
            PARALLAX_MAX *
            LAYER_SPEEDS.back *
            PARALLAX_MULTIPLIER *
            LAYER_MOVEMENT_MULTIPLIERS.back,
          PARALLAX_MAX,
        ),
      )
      backYTarget.set(
        clamp(
          combinedY *
            PARALLAX_MAX *
            LAYER_SPEEDS.back *
            PARALLAX_MULTIPLIER *
            LAYER_MOVEMENT_MULTIPLIERS.back,
          PARALLAX_MAX,
        ),
      )
      frontXTarget.set(
        clamp(
          combinedX *
            PARALLAX_MAX *
            LAYER_SPEEDS.front *
            PARALLAX_MULTIPLIER *
            LAYER_MOVEMENT_MULTIPLIERS.front,
          PARALLAX_MAX,
        ),
      )
      frontYTarget.set(
        clamp(
          combinedY *
            PARALLAX_MAX *
            LAYER_SPEEDS.front *
            PARALLAX_MULTIPLIER *
            LAYER_MOVEMENT_MULTIPLIERS.front,
          PARALLAX_MAX,
        ),
      )

      rafId = requestAnimationFrame(animate)
    }

    const handleMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      mouseRef.current.x =
        (event.clientX - rect.left - rect.width / 2) / (rect.width / 2)
      mouseRef.current.y =
        (event.clientY - rect.top - rect.height / 2) / (rect.height / 2)
      mouseLastMovedAtRef.current = performance.now()
    }

    const startAnimationLoop = () => {
      if (rafId != null || document.visibilityState !== 'visible') {
        return
      }

      const now = performance.now()
      if (pausedAt != null) {
        idleRef.current.startTime += now - pausedAt
        pausedAt = null
      } else {
        idleRef.current.startTime = now
      }

      rafId = requestAnimationFrame(animate)
    }

    const stopAnimationLoop = () => {
      if (rafId == null) {
        return
      }

      cancelAnimationFrame(rafId)
      rafId = null
      pausedAt = performance.now()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        startAnimationLoop()
        return
      }

      stopAnimationLoop()
    }

    window.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    startAnimationLoop()

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (rafId != null) {
        cancelAnimationFrame(rafId)
      }
    }
  }, [backXTarget, backYTarget, containerRef, frontXTarget, frontYTarget])

  return {
    backX,
    backY,
    frontX,
    frontY,
    containerSize,
  }
}
