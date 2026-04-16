import { useNavigation } from '@react-navigation/native'
import type React from 'react'
import { useEffect } from 'react'
import { Button, StyleSheet, Text, View } from 'react-native'
import {
  useCameraPermission,
  useMicrophonePermission,
} from 'react-native-vision-camera'

export function PermissionsScreen(): React.ReactElement {
  const navigation = useNavigation()
  const cameraPermission = useCameraPermission()
  const microphonePermission = useMicrophonePermission()

  useEffect(() => {
    if (cameraPermission.hasPermission) {
      navigation.navigate('Camera')
    }
  }, [cameraPermission.hasPermission, navigation])

  return (
    <View style={styles.textContainer}>
      <Text style={styles.text}>No Camera Permission!</Text>
      <Button
        title="Grant"
        onPress={() => {
          cameraPermission.requestPermission()
          microphonePermission.requestPermission()
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: 'white',
  },
})
