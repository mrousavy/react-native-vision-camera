import React, { useEffect, useMemo, useState } from 'react'
import { useCameraSession } from '../hooks/useCameraSession'
import { NativePreviewView } from '../PreviewView'
import {
  type CameraDeviceController,
  HybridCameraFactory,
  type CameraDevice,
  type CameraOutput,
  type PreviewViewProps,
  type SetCameraDeviceConfiguration,
} from '..'
import type { ViewProps } from 'react-native'

export interface CameraProps
  extends Omit<PreviewViewProps, 'previewOutput'>,
    ViewProps {
  enableMultiCamSupport?: boolean
  input: CameraDevice
  outputs: CameraOutput[]
  configuration?: SetCameraDeviceConfiguration
}

export function Camera({
  enableMultiCamSupport = false,
  input,
  outputs,
  configuration = {},
  ...props
}: CameraProps): React.ReactElement {
  const [controller, setController] = useState<CameraDeviceController>()
  const session = useCameraSession({
    enableMultiCamSupport: enableMultiCamSupport,
    isActive: true,
  })
  const previewOutput = useMemo(
    () => HybridCameraFactory.createPreviewOutput(),
    []
  )

  // when device or device configuration changes
  useEffect(() => {
    if (controller == null) return
    ;(async () => {
      await controller.configure(configuration)
    })()
  }, [configuration, controller])

  // when inputs/outputs change
  useEffect(() => {
    if (session == null) return
    ;(async () => {
      const c = await session.configure([
        {
          input: input,
          outputs: [...outputs, previewOutput],
        },
      ])
      setController(c[0])
    })()
  }, [configuration, input, outputs, previewOutput, session])

  return <NativePreviewView {...props} previewOutput={previewOutput} />
}
