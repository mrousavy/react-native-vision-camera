import { useEffect, useState } from 'react'
import { AudioInputDevices } from '../AudioInputDevices'
import type { AudioInputDevice } from '../types/AudioInputDevice'

/**
 * Get the audio input devices for the current audio session.
 *
 * Built in microphone is always available after permissions,
 * while `external` devices might be plugged in or out at any point,
 * so the result of this function might update over time.
 */
export function useAudioInputDevices(): AudioInputDevice[] {
  const [devices, setDevices] = useState(AudioInputDevices.getAvailableAudioInputDevices)

  useEffect(() => {
    const listener = AudioInputDevices.addAudioInputChangedListener((newDevices) => {
      setDevices(newDevices)
    })
    return () => listener.remove()
  }, [])

  return devices
}
