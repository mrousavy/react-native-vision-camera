import { useEffect } from 'react'
import type { CameraSession } from '../../specs/session/CameraSession.nitro'
import { useStableCallback } from './useStableCallback'

export function useCameraSessionIsRunning(
  session: CameraSession | undefined,
  isActive: boolean,
  onError: (error: Error) => void,
): void {
  const stableOnError = useStableCallback(onError)

  useEffect(() => {
    if (session == null) return
    const load = async () => {
      try {
        if (isActive) {
          await session.start()
        } else {
          await session.stop()
        }
      } catch (error) {
        stableOnError(error as Error)
      }
    }
    load()
  }, [isActive, session, stableOnError])
}
