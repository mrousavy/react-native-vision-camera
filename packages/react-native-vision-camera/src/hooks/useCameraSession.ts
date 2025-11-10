import { useEffect, useState } from 'react'
import { type CameraSession } from '../specs/CameraSession.nitro'
import { HybridCameraFactory } from '..'

interface Props {
  enableMultiCamSupport: boolean
  isActive: boolean
}

export function useCameraSession({
  enableMultiCamSupport,
  isActive,
}: Props): CameraSession | undefined {
  const [session, setSession] = useState<CameraSession>()

  // session creation
  useEffect(() => {
    let isCanceled = false
    const load = async () => {
      const s = await HybridCameraFactory.createCameraSession(
        enableMultiCamSupport
      )
      if (isCanceled) return
      setSession(s)
    }
    load()
    return () => {
      isCanceled = true
    }
  }, [enableMultiCamSupport])

  // session lifecycle changes
  useEffect(() => {
    if (session == null) return
    if (isActive) {
      session.start()
    } else {
      session.stop()
    }
  }, [isActive, session])

  // session teardown
  useEffect(() => {
    return () => {
      // remove all connections & dispose the session
      session?.configure([])
      session?.dispose()
    }
  }, [session])

  return session
}
