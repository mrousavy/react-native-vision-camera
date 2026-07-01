import { useEffect, useState } from 'react'
import type { CameraSession } from '../../specs/session/CameraSession.nitro'
import { VisionCamera } from '../../VisionCamera'

interface Props {
  enableMultiCamSupport: boolean
}

export function useCameraSession({
  enableMultiCamSupport,
}: Props): CameraSession | undefined {
  const [session, setSession] = useState<CameraSession>()

  // session creation
  useEffect(() => {
    let isCanceled = false
    const load = async () => {
      const s = await VisionCamera.createCameraSession(enableMultiCamSupport)
      if (isCanceled) {
        s.dispose()
        return
      }
      setSession(s)
    }
    load()
    return () => {
      isCanceled = true
    }
  }, [enableMultiCamSupport])

  // session teardown
  useEffect(() => {
    return () => { 
      // Detach outputswhile the session is still running so AVFoundation                                                                                                         
      // drains each output's figCaptureSession pointer synchronously.  
      session?.configure([])
      session?.stop()
    }
  }, [session])

  return session
}
