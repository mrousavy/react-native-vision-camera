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
      if (session == null) return
      // stop the session and remove all connections.
      // failures during teardown are not actionable, so ignore them.
      session.stop().catch(() => {})
      session.configure([]).catch(() => {})
      // ...then release the native session deterministically instead of waiting
      // for GC. The native session's destructor is what fully detaches outputs
      // at the CoreMedia level - a re-mounted <Camera> re-uses output objects in
      // a new session, and attaching them while they are still attached to this
      // session crashes (see #3773). All three calls run in order on the native
      // session queue; the native object stays alive until they completed.
      session.dispose()
    }
  }, [session])

  return session
}
