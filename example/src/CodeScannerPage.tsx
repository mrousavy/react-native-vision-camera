import * as React from 'react'
import { useCallback, useRef, useState } from 'react'
import type { AlertButton } from 'react-native'
import { Alert, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import type { Code, CodeScannerFrame } from 'react-native-vision-camera'
import { useCameraDevice, useCodeScanner } from 'react-native-vision-camera'
import { Camera } from 'react-native-vision-camera'
import { CONTENT_SPACING, CONTROL_BUTTON_SIZE, SAFE_AREA_PADDING } from './Constants'
import { useIsForeground } from './hooks/useIsForeground'
import { StatusBarBlurBackground } from './views/StatusBarBlurBackground'
import IonIcon from 'react-native-vector-icons/Ionicons'
import type { Routes } from './Routes'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useIsFocused } from '@react-navigation/core'

const showCodeAlert = (value: string, onDismissed: () => void): void => {
  const buttons: AlertButton[] = [
    {
      text: 'Close',
      style: 'cancel',
      onPress: onDismissed,
    },
  ]
  if (value.startsWith('http')) {
    buttons.push({
      text: 'Open URL',
      onPress: () => {
        Linking.openURL(value)
        onDismissed()
      },
    })
  }
  Alert.alert('Scanned Code', value, buttons)
}

type Props = NativeStackScreenProps<Routes, 'CodeScannerPage'>
export function CodeScannerPage({ navigation }: Props): React.ReactElement {
  // 1. Use a simple default back camera
  const device = useCameraDevice('back')

  // 2. Only activate Camera when the app is focused and this screen is currently opened
  const isFocused = useIsFocused()
  const isForeground = useIsForeground()
  const isActive = isFocused && isForeground

  // 3. (Optional) enable a torch setting
  const [torch, setTorch] = useState(false)

  // 4. On code scanned, we show an aler to the user
  const isShowingAlert = useRef(false)
  const onCodeScanned = useCallback((codes: Code[], frame: CodeScannerFrame) => {
    console.log(`=== Scanned ${codes.length} codes ===`)
    console.log('Frame:', frame)
    
    // 各コードの詳細をログ出力
    codes.forEach((code, index) => {
      console.log(`\nCode ${index + 1}:`)
      console.log('  Type:', code.type)
      console.log('  Value:', code.value)
      console.log('  Frame:', code.frame)
      console.log('  Corners:', code.corners)
      console.log('  Corners count:', code.corners?.length ?? 0)
      
      // コーナー座標が空かどうか確認
      if (code.corners && code.corners.length > 0) {
        console.log('  ✅ Corners are available!')
        code.corners.forEach((corner, i) => {
          console.log(`    Corner ${i + 1}: x=${corner.x}, y=${corner.y}`)
        })
      } else {
        console.log('  ⚠️  Corners are empty or null')
      }
    })
    
    const value = codes[0]?.value
    if (value == null) return
    if (isShowingAlert.current) return
    showCodeAlert(value, () => {
      isShowingAlert.current = false
    })
    isShowingAlert.current = true
  }, [])

  // 5. Initialize the Code Scanner to scan QR codes and Barcodes
  const codeScanner = useCodeScanner({
    codeTypes: [
      'qr', 
      'ean-13',
      'upc-a',
      'upc-e',
      'code-128',
      'code-39',
      'code-93',
      'codabar',
      'gs1-data-bar',
    ],
    onCodeScanned: onCodeScanned,
  })

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Code Scanner</Text>
      {device != null && (
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={isActive}
          codeScanner={codeScanner}
          torch={torch ? 'on' : 'off'}
          enableZoomGesture={true}
        />
      )}

      <StatusBarBlurBackground />

      <View style={styles.rightButtonRow}>
        <TouchableOpacity style={styles.button} onPress={() => setTorch(!torch)}>
          <IonIcon name={torch ? 'flash' : 'flash-off'} color="white" size={24} />
        </TouchableOpacity>
      </View>

      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={navigation.goBack}>
        <IonIcon name="chevron-back" color="white" size={35} />
      </TouchableOpacity>
    </View>
  ) 
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  text: {
    position: 'absolute',
    top: SAFE_AREA_PADDING.paddingTop + 20,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    zIndex: 10,
  },
  button: {
    marginBottom: CONTENT_SPACING,
    width: CONTROL_BUTTON_SIZE,
    height: CONTROL_BUTTON_SIZE,
    borderRadius: CONTROL_BUTTON_SIZE / 2,
    backgroundColor: 'rgba(140, 140, 140, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightButtonRow: {
    position: 'absolute',
    right: SAFE_AREA_PADDING.paddingRight,
    top: SAFE_AREA_PADDING.paddingTop,
  },
  backButton: {
    position: 'absolute',
    left: SAFE_AREA_PADDING.paddingLeft,
    top: SAFE_AREA_PADDING.paddingTop,
  },
})
