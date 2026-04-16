import { LANDING_SKIP_INTRO_STORAGE_KEY } from '@/components/landing/constants'

export function markSkipIntroOnNextLandingVisit() {
  window.localStorage.setItem(LANDING_SKIP_INTRO_STORAGE_KEY, '1')
}

export function readAndClearSkipIntroOnNextLandingVisit() {
  const shouldSkipIntro =
    window.localStorage.getItem(LANDING_SKIP_INTRO_STORAGE_KEY) === '1'
  window.localStorage.removeItem(LANDING_SKIP_INTRO_STORAGE_KEY)
  return shouldSkipIntro
}

export function shouldSkipIntroForNextPath(pathname: string) {
  return (
    pathname === '/docs' ||
    pathname.startsWith('/docs/') ||
    pathname === '/api' ||
    pathname.startsWith('/api/')
  )
}
