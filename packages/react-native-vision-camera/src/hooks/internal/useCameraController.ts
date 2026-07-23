import { useEffect, useMemo, useState } from 'react'
import type { CameraController } from '../../specs/CameraController.nitro'
import type { Constraint } from '../../specs/common-types/Constraint'
import type { MirrorMode } from '../../specs/common-types/MirrorMode'
import type { CameraDevice } from '../../specs/inputs/CameraDevice.nitro'
import type { CameraOutput } from '../../specs/outputs/CameraOutput.nitro'
import type { CameraSession } from '../../specs/session/CameraSession.nitro'
import type { CameraSessionConfig } from '../../specs/session/CameraSessionConfig.nitro'
import { useMemoizedArray } from './useMemoizedArray'
import { useStableCallback } from './useStableCallback'

interface Config {
  mirrorMode?: MirrorMode
  allowBackgroundAudioPlayback?: boolean
  constraints?: Constraint[]
  onSessionConfigSelected?: (config: CameraSessionConfig) => void

  onConfigured?: () => void
  onConfigureError?: (error: Error) => void
  getInitialZoom?: () => number | undefined
  getInitialExposureBias?: () => number | undefined
}

/**
 * Connect the given {@linkcode device} to the given {@linkcode outputs}
 * with the given {@linkcode mirrorMode}  applied to each output,
 * and return a {@linkcode CameraController}.
 *
 * @note The {@linkcode outputs} have to be explicitly memoized.
 */
export function useCameraController(
  session: CameraSession | undefined,
  device: CameraDevice | undefined,
  outputs: CameraOutput[],
  {
    mirrorMode = 'auto',
    constraints = [],
    onSessionConfigSelected,
    allowBackgroundAudioPlayback,
    getInitialExposureBias,
    onConfigured,
    onConfigureError,
    getInitialZoom,
  }: Config = {},
): CameraController | undefined {
  const [controller, setController] = useState<CameraController>()

  // Keep some things stable so the `useEffect` doesn't re-trigger
  const stableOutputs = useMemoizedArray(outputs)
  const stableGetInitialExposureBias = useStableCallback(
    getInitialExposureBias ?? (() => undefined),
  )
  const stableGetInitialZoom = useStableCallback(
    getInitialZoom ?? (() => undefined),
  )
  const stableOnConfigured = useStableCallback(onConfigured ?? (() => {}))
  const stableOnConfigureError = useStableCallback(onConfigureError ?? (() => {}))
  const stableOnSessionConfigSelected = useStableCallback(
    onSessionConfigSelected ?? (() => {}),
  )

  // TODO: Can we use something like useSyncExternalStore or whatever to avoid "wrong" dependencies?
  // biome-ignore lint/correctness/useExhaustiveDependencies: It's an array of objects, we either have to deep-memo or just stringify.
  const stableConstraints = useMemo<Constraint[]>(() => {
    return [
      ...constraints,
      ...stableOutputs.map<Constraint>((o) => ({ resolutionBias: o })),
    ]
  }, [JSON.stringify(constraints), stableOutputs])

  // This effect re-configures the CameraSession and returns a `controller`.
  // This is expensive and should only be done if any inputs change.
  // To prevent shallow inequality causing a re-configuration,
  // we memoize all objects, callbacks or arrays beforehand.
  useEffect(() => {
    if (session == null) {
      // default: null -> empty controllers
      setController(undefined)
      return
    }

    let isCanceled = false
    const load = async () => {
      if (device == null) {
        // No device, configure with empty devices
        session.configure([], {})
        setController(undefined)
      } else {
        // Build the connection before the try - a throw from a user-supplied
        // getter here is a caller bug, not a configure failure, and must not
        // be misreported through onConfigureError.
        const connection = {
          input: device,
          outputs: stableOutputs.map((o) => ({
            output: o,
            mirrorMode: mirrorMode,
          })),
          constraints: stableConstraints,
          initialExposureBias: stableGetInitialExposureBias?.(),
          initialZoom: stableGetInitialZoom?.(),
          onSessionConfigSelected: stableOnSessionConfigSelected,
        }
        // Device + outputs - configure session
        let controllers: CameraController[]
        try {
          controllers = await session.configure([connection], {
            allowBackgroundAudioPlayback: allowBackgroundAudioPlayback,
          })
        } catch (e) {
          // A rejected configure() means the session could never be built
          // (e.g. the device rejected the use-case combination). Without this
          // handler the rejection is silently swallowed: no controller, no
          // onError, and the preview stays black forever. Surface it to the
          // user's onError.
          if (isCanceled) return
          setController(undefined)
          const error = e instanceof Error ? e : new Error(String(e))
          stableOnConfigureError(error)
          return
        }
        if (isCanceled) {
          controllers.forEach((c) => {
            c.dispose()
          })
          return
        }
        stableOnConfigured?.()
        setController(controllers[0])
      }
    }
    load()
    return () => {
      isCanceled = true
    }
  }, [
    device,
    mirrorMode,
    session,
    allowBackgroundAudioPlayback,
    stableOutputs,
    stableOnConfigured,
    stableOnConfigureError,
    stableGetInitialExposureBias,
    stableGetInitialZoom,
    stableOnSessionConfigSelected,
    stableConstraints,
  ])

  return controller
}
