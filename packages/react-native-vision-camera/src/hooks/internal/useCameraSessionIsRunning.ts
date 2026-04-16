import { useEffect } from 'react'
import type { CameraSession } from '../../specs/session/CameraSession.nitro'

export function useCameraSessionIsRunning(
  session: CameraSession | undefined,
  isActive: boolean,
): void {
  useEffect(() => {
    if (session == null) return
    const load = async () => {
      if (isActive) {
        await session.start()
      } else {
        await session.stop()
      }
    }
    load()
  }, [isActive, session])
}
