import type React from 'react'
import { useCallback, useRef } from 'react'
import { StyleSheet } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import { BlurContainer } from './BlurContainer'

export interface CaptureButtonProps {
  takePhoto: () => Promise<void>
  startRecording: () => Promise<void>
  stopRecording: () => Promise<void>
}

const AnimatedBlurContainer = Animated.createAnimatedComponent(BlurContainer)
const LONG_PRESS_DURATION_MS = 300

export function CaptureButton({
  takePhoto,
  startRecording,
  stopRecording,
}: CaptureButtonProps): React.ReactElement {
  const isPressed = useSharedValue(false)
  const isCapturing = useSharedValue(false)
  const didLongPressActivate = useRef(false)
  const isRecording = useRef(false)
  const recordingStartPromise = useRef<Promise<void> | null>(null)
  const shouldStopAfterStart = useRef(false)

  const outerScale = useDerivedValue(() => {
    return withSpring(isCapturing.value ? 1.4 : 1.0, {
      mass: 1,
      stiffness: 1000,
      damping: 500,
    })
  })
  const innerScale = useDerivedValue(() => {
    return withSpring(isPressed.value ? 0.7 : 1.0, {
      mass: 1,
      stiffness: 1500,
      damping: 500,
    })
  })

  const tapGesture = Gesture.Tap()
    .maxDuration(LONG_PRESS_DURATION_MS)
    .maxDistance(20)
    .onBegin(() => {
      isPressed.set(true)
    })
    .onFinalize(() => {
      isPressed.set(false)
    })
    .onEnd(async () => {
      isCapturing.set(true)
      try {
        await takePhoto()
      } finally {
        isCapturing.set(false)
      }
    })
    .runOnJS(true)

  const stopRecordingNow = useCallback(async () => {
    if (!isRecording.current) return
    isRecording.current = false
    try {
      await stopRecording()
    } catch (error) {
      console.error(`Failed to stop recording!`, error)
    }
  }, [stopRecording])

  const startRecordingSafely = useCallback(async () => {
    if (recordingStartPromise.current != null || isRecording.current) return
    shouldStopAfterStart.current = false
    let startPromise: Promise<void> | null = null
    try {
      startPromise = startRecording()
      recordingStartPromise.current = startPromise
      await startPromise
      if (recordingStartPromise.current !== startPromise) return
      recordingStartPromise.current = null
      isRecording.current = true
      if (shouldStopAfterStart.current) {
        shouldStopAfterStart.current = false
        await stopRecordingNow()
      }
    } catch (error) {
      if (
        startPromise != null &&
        recordingStartPromise.current === startPromise
      ) {
        recordingStartPromise.current = null
      }
      isRecording.current = false
      shouldStopAfterStart.current = false
      console.error(`Failed to start recording!`, error)
    }
  }, [startRecording, stopRecordingNow])

  const stopRecordingSafely = useCallback(async () => {
    if (recordingStartPromise.current != null) {
      shouldStopAfterStart.current = true
      return
    }
    await stopRecordingNow()
  }, [stopRecordingNow])

  const longPressGesture = Gesture.LongPress()
    .minDuration(LONG_PRESS_DURATION_MS)
    .maxDistance(50)
    .shouldCancelWhenOutside(false)
    .onBegin(() => {
      didLongPressActivate.current = false
      isPressed.set(true)
    })
    .onStart(() => {
      didLongPressActivate.current = true
      startRecordingSafely()
    })
    .onFinalize(() => {
      isPressed.set(false)
      if (!didLongPressActivate.current) return
      didLongPressActivate.current = false
      stopRecordingSafely()
    })
    .runOnJS(true)

  const captureGesture = Gesture.Exclusive(longPressGesture, tapGesture)

  const outerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: outerScale.value }],
  }))
  const innerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: innerScale.value }],
  }))

  return (
    <GestureDetector gesture={captureGesture}>
      <AnimatedBlurContainer
        style={[styles.circle, styles.outer, outerStyle]}
        tint="light"
      >
        <AnimatedBlurContainer
          style={[styles.circle, styles.inner, innerStyle]}
          tint="light"
        />
      </AnimatedBlurContainer>
    </GestureDetector>
  )
}

const styles = StyleSheet.create({
  circle: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  outer: {
    padding: 10,
  },
  inner: {
    padding: 30,
  },
})
