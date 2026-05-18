/**
 * Barcode Scanner Screen
 *
 * Tests react-native-vision-camera with MLKit barcode scanner.
 * Bounding boxes are overlaid on detected barcodes in view-space.
 */

import { useIsFocused, useNavigation } from '@react-navigation/native'
import { useCallback, useMemo, useRef, useState } from 'react'
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import {
  Camera,
  type CameraRef,
  useCameraDevice,
  useCameraPermission,
  useFrameOutput,
} from 'react-native-vision-camera'
import { useBarcodeScanner } from 'react-native-vision-camera-barcode-scanner'
import { runOnJS } from 'react-native-worklets'
import { IconButton } from '../components/IconButton'
import { Row } from '../components/Row'

// ─── Types ─────────────────────────────────────────────────────────────────

type BarcodeData = {
  camLeft: number
  camTop: number
  camRight: number
  camBottom: number
}

type FrameSnapshot = {
  barcodes: BarcodeData[]
}

// ─── Main component ────────────────────────────────────────────────────────

export function BarcodeScreen() {
  const navigation = useNavigation()
  const isScreenFocused = useIsFocused()
  const cameraRef = useRef<CameraRef>(null)

  const { hasPermission, requestPermission } = useCameraPermission()
  const device = useCameraDevice('back')

  const [snapshot, setSnapshot] = useState<FrameSnapshot | null>(null)

  // ── Frame processor ───────────────────────────────────────────────────────
  const scanner = useBarcodeScanner({ barcodeFormats: ['all-formats'] })

  const onFrameSnapshot = useCallback((s: FrameSnapshot) => {
    setSnapshot(s)
  }, [])

  const frameOutput = useFrameOutput({
    // MLKit on Android only accepts YUV_420_888 (or JPEG).
    pixelFormat: 'yuv',
    onFrame(frame) {
      'worklet'
      try {
        const raw = scanner.scanCodes(frame)

        const barcodes: BarcodeData[] = raw.map((b) => {
          const bb = b.boundingBox
          // Convert bounding-box corners from frame-space to camera-space,
          // which accounts for physical rotation/mirroring.
          const tl = frame.convertFramePointToCameraPoint({
            x: bb.left,
            y: bb.top,
          })
          const br = frame.convertFramePointToCameraPoint({
            x: bb.right,
            y: bb.bottom,
          })
          return {
            camLeft: Math.min(tl.x, br.x),
            camTop: Math.min(tl.y, br.y),
            camRight: Math.max(tl.x, br.x),
            camBottom: Math.max(tl.y, br.y),
          }
        })

        runOnJS(onFrameSnapshot)({ barcodes })
      } finally {
        frame.dispose()
      }
    },
  })

  // ── Camera → view coordinate conversion ──────────────────────────────────
  const camToView = useCallback(
    (cx: number, cy: number): { x: number; y: number } => {
      if (cameraRef.current) {
        try {
          return cameraRef.current.convertCameraPointToViewPoint({
            x: cx,
            y: cy,
          })
        } catch {
          // PreviewView not ready yet.
        }
      }
      return { x: cx, y: cy }
    },
    [],
  )

  const viewBoxes = useMemo(() => {
    if (!snapshot) return []
    return snapshot.barcodes.map((b) => {
      const tl = camToView(b.camLeft, b.camTop)
      const br = camToView(b.camRight, b.camBottom)
      const left = Math.min(tl.x, br.x)
      const top = Math.min(tl.y, br.y)
      const right = Math.max(tl.x, br.x)
      const bottom = Math.max(tl.y, br.y)
      return {
        left,
        top,
        width: Math.max(right - left, 4),
        height: Math.max(bottom - top, 4),
      }
    })
  }, [snapshot, camToView])

  // ── Permission / device guards ────────────────────────────────────────────
  if (!hasPermission) {
    return (
      <View style={styles.centered}>
        <Text style={styles.msgText}>Camera permission is required</Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (!device) {
    return (
      <View style={styles.centered}>
        <Text style={styles.msgText}>No back camera found</Text>
      </View>
    )
  }

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <View style={styles.cameraWrap}>
        <Camera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={isScreenFocused}
          outputs={[frameOutput]}
          resizeMode="cover"
        />

        {/* Bounding-box overlays */}
        {viewBoxes.map((box, i) => (
          <View
            key={i}
            pointerEvents="none"
            style={[
              styles.barcodeBox,
              {
                left: box.left,
                top: box.top,
                width: box.width,
                height: box.height,
              },
            ]}
          />
        ))}
      </View>

      {/* Close button */}
      <View style={styles.topBar}>
        <Row>
          <View style={styles.flex} />
          <IconButton
            iconName="close"
            onPress={() => navigation.goBack()}
          />
        </Row>
      </View>

      {/* Debug info */}
      <View style={styles.debugInfo}>
        <Text style={styles.debugText}>
          Barcodes: {snapshot?.barcodes.length ?? 0}
        </Text>
      </View>
    </View>
  )
}

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    flex: 1,
    backgroundColor: '#0d0d0d',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  msgText: { color: '#fff', fontSize: 16 },
  btn: {
    backgroundColor: '#2979ff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '600' },

  cameraWrap: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    overflow: 'hidden',
  },

  barcodeBox: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(255, 220, 0, 0.85)',
    borderRadius: 3,
    backgroundColor: 'rgba(255, 220, 0, 0.15)',
  },

  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: 12,
    paddingRight: 12,
  },

  debugInfo: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
  },

  debugText: {
    color: '#fff',
    fontSize: 14,
  },

  flex: {
    flex: 1,
  },
})
