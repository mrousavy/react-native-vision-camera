'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useRef } from 'react'
import {
  FOCUS_HIT_TEST,
  FOCUS_RETICLE_BOX_SIZE,
  FOCUS_TRANSITION,
  FRONT_LAYER_OFFSET_Y_PERCENT,
  INTRO_LOGO_FOCUS_POINT,
  LANDING_BG_SIZES,
  LOGO_SIZE,
} from '@/components/landing/constants'
import {
  getFrontLayerObjectPositionXPercent,
  isForegroundHit,
} from '@/components/landing/geometry'
import { ParallaxBlurLayer } from '@/components/landing/ParallaxBlurLayer'
import {
  markSkipIntroOnNextLandingVisit,
  shouldSkipIntroForNextPath,
} from '@/components/landing/storage'
import { useFocusReticle } from '@/components/landing/useFocusReticle'
import { useParallaxMotion } from '@/components/landing/useParallaxMotion'
import landingBgBack from '../../../public/img/landing-bg-back.webp'
import landingBgFront from '../../../public/img/landing-bg-front.webp'

export default function HomePage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const logoHitAreaRef = useRef<HTMLDivElement>(null)
  const logoWordmarkRef = useRef<HTMLDivElement>(null)
  const { backX, backY, containerSize, frontX, frontY } =
    useParallaxMotion(containerRef)

  const getIntroLogoFocusPosition = useCallback(() => {
    const containerRect = containerRef.current?.getBoundingClientRect()
    const logoRect = logoWordmarkRef.current?.getBoundingClientRect()

    if (containerRect == null || logoRect == null) {
      return { xPercent: 50, yPercent: 50 }
    }

    const x =
      logoRect.left +
      logoRect.width * INTRO_LOGO_FOCUS_POINT.xRatio -
      containerRect.left
    const y =
      logoRect.top +
      logoRect.height * INTRO_LOGO_FOCUS_POINT.yRatio -
      containerRect.top

    return {
      xPercent: (x / containerRect.width) * 100,
      yPercent: (y / containerRect.height) * 100,
    }
  }, [])

  const {
    blurAmounts,
    focusTarget,
    isReticlePulsing,
    isReticleVisible,
    reticlePosition,
    triggerFocus,
  } = useFocusReticle(getIntroLogoFocusPosition)

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return
      }

      const target = event.target
      if (!(target instanceof Element)) {
        return
      }

      const anchor = target.closest('a[href]')
      if (
        !(anchor instanceof HTMLAnchorElement) ||
        anchor.target === '_blank' ||
        anchor.hasAttribute('download') ||
        anchor.origin !== window.location.origin
      ) {
        return
      }

      if (shouldSkipIntroForNextPath(anchor.pathname)) {
        markSkipIntroOnNextLandingVisit()
      }
    }

    document.addEventListener('click', handleDocumentClick, true)
    return () => {
      document.removeEventListener('click', handleDocumentClick, true)
    }
  }, [])

  const containerAspectRatio =
    containerSize != null && containerSize.height > 0
      ? containerSize.width / containerSize.height
      : null
  const frontLayerObjectPositionX =
    getFrontLayerObjectPositionXPercent(containerAspectRatio)
  const isLogoFocused = focusTarget === 'logo'
  const handleLogoLinkPointerDown = isLogoFocused
    ? (event: React.PointerEvent<HTMLAnchorElement>) => event.stopPropagation()
    : undefined
  const logoLinkTabIndex = isLogoFocused ? 0 : -1

  const handleFocusPointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    const targetElement = event.target instanceof Element ? event.target : null

    if (targetElement?.closest('a, button')) {
      return
    }

    const container = containerRef.current
    if (container == null) {
      return
    }

    const rect = container.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    const normalizedX = x / rect.width
    const normalizedY = y / rect.height
    const xPercent = normalizedX * 100
    const yPercent = normalizedY * 100
    const frontOffset = { x: frontX.get(), y: frontY.get() }

    let target: typeof focusTarget = 'background'
    const logoRect = logoHitAreaRef.current?.getBoundingClientRect()
    if (logoRect != null) {
      const withinLogo =
        event.clientX >= logoRect.left - FOCUS_HIT_TEST.logoPaddingPx &&
        event.clientX <= logoRect.right + FOCUS_HIT_TEST.logoPaddingPx &&
        event.clientY >= logoRect.top - FOCUS_HIT_TEST.logoPaddingPx &&
        event.clientY <= logoRect.bottom + FOCUS_HIT_TEST.logoPaddingPx

      if (withinLogo) {
        target = 'logo'
      } else if (
        isForegroundHit(
          normalizedX,
          normalizedY,
          rect.width,
          rect.height,
          frontOffset,
          frontLayerObjectPositionX,
        )
      ) {
        target = 'foreground'
      }
    } else if (
      isForegroundHit(
        normalizedX,
        normalizedY,
        rect.width,
        rect.height,
        frontOffset,
        frontLayerObjectPositionX,
      )
    ) {
      target = 'foreground'
    }

    triggerFocus(target, { xPercent, yPercent })
  }

  return (
    <div
      ref={containerRef}
      className="relative flex-1 min-h-0 w-full overflow-hidden touch-none"
      onPointerDown={handleFocusPointerDown}
    >
      <h1 className="sr-only">
        VisionCamera - Camera Library for React Native
      </h1>
      <p className="sr-only">
        The most powerful high-performance Camera library for React Native.
        Supports Photo and Video capture, QR/Barcode scanning, Frame Processors,
        and more.
      </p>

      <ParallaxBlurLayer
        x={backX}
        y={backY}
        blurAmount={blurAmounts.back}
        zIndexClassName="z-0"
      >
        <div
          className="relative h-full w-full"
          style={{
            transform: 'scale(1.05)',
          }}
        >
          <Image
            src={landingBgBack}
            alt="Landscape scene captured with VisionCamera for React Native"
            fill
            className="object-cover"
            sizes={LANDING_BG_SIZES}
            quality={100}
            placeholder="blur"
            draggable={false}
            priority
          />
        </div>
      </ParallaxBlurLayer>

      <div className="absolute inset-0 flex items-center justify-center z-[1]">
        <div ref={logoHitAreaRef} className="flex flex-col items-center gap-6">
          <div
            ref={logoWordmarkRef}
            className="w-[min(80vw,384px)]"
            style={{
              filter: `blur(${blurAmounts.logo}px)`,
              transition: FOCUS_TRANSITION,
            }}
          >
            <Image
              src="/vc_logo.svg"
              alt="VisionCamera"
              width={LOGO_SIZE.width}
              height={LOGO_SIZE.height}
              className="block h-auto w-full brightness-0 invert select-none"
              draggable={false}
              priority
            />
          </div>
          <div
            className="flex flex-wrap items-center justify-center gap-3"
            style={{
              filter: isLogoFocused ? 'none' : `blur(${blurAmounts.logo}px)`,
              transition: FOCUS_TRANSITION,
            }}
          >
            <Link
              href="/docs"
              onPointerDown={handleLogoLinkPointerDown}
              tabIndex={logoLinkTabIndex}
              aria-disabled={!isLogoFocused}
              className={`rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition-opacity hover:opacity-90 ${
                isLogoFocused ? 'pointer-events-auto' : 'pointer-events-none'
              }`}
            >
              Get Started
            </Link>
            <Link
              href="/api"
              onPointerDown={handleLogoLinkPointerDown}
              tabIndex={logoLinkTabIndex}
              aria-disabled={!isLogoFocused}
              className={`rounded-full bg-black/60 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-black/70 ${
                isLogoFocused ? 'pointer-events-auto' : 'pointer-events-none'
              }`}
            >
              API Reference
            </Link>
          </div>
        </div>
      </div>

      <ParallaxBlurLayer
        x={frontX}
        y={frontY}
        blurAmount={blurAmounts.front}
        zIndexClassName="z-[2]"
      >
        <div
          className="relative h-full w-full"
          style={{
            transform: `translateY(${FRONT_LAYER_OFFSET_Y_PERCENT}%) scale(1.05)`,
          }}
        >
          <Image
            src={landingBgFront}
            alt="Foreground detail captured with VisionCamera for React Native"
            fill
            className="object-cover"
            style={{
              objectPosition: `${frontLayerObjectPositionX}% 50%`,
            }}
            sizes={LANDING_BG_SIZES}
            quality={100}
            placeholder="blur"
            draggable={false}
            priority
          />
        </div>
      </ParallaxBlurLayer>

      <div className="absolute inset-0 pointer-events-none z-[3]">
        <div className="absolute left-0 right-0 top-1/3 h-[1.5px] bg-white/35" />
        <div className="absolute left-0 right-0 bottom-1/3 h-[1.5px] bg-white/35" />
        <div className="absolute left-1/3 top-0 bottom-0 w-[1.5px] bg-white/35" />
        <div className="absolute right-1/3 top-0 bottom-0 w-[1.5px] bg-white/35" />
      </div>

      <div className="absolute inset-0 pointer-events-none z-[4]">
        <div
          className={`absolute transition-opacity duration-150 ${
            isReticleVisible ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            left: `${reticlePosition.xPercent}%`,
            top: `${reticlePosition.yPercent}%`,
            width: `${FOCUS_RETICLE_BOX_SIZE}px`,
            height: `${FOCUS_RETICLE_BOX_SIZE}px`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div
            className={`relative h-full w-full ${isReticlePulsing ? 'focus-reticle-pulse' : ''}`}
          >
            <div className="absolute inset-0 border-2 border-yellow-400 rounded-sm" />
            <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[2px] h-3 bg-yellow-400" />
            <div className="absolute left-1/2 bottom-0 -translate-x-1/2 w-[2px] h-3 bg-yellow-400" />
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-[2px] bg-yellow-400" />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-[2px] bg-yellow-400" />
          </div>
        </div>
      </div>
    </div>
  )
}
