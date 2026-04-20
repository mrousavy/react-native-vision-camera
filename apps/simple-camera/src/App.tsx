import {
  createStaticNavigation,
  type StaticParamList,
} from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useEffect } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { VisionCamera } from 'react-native-vision-camera'
import { CameraScreen } from './screens/CameraScreen'
import { PermissionsScreen } from './screens/PermissionsScreen'
import { PhotoScreen } from './screens/PhotoScreen'
import { VideoScreen } from './screens/VideoScreen'
import { Alert } from 'react-native'

interface AppProps {
  grantPermissionsOnLaunch?: boolean
}

const RootStack = createNativeStackNavigator({
  initialRouteName:
    VisionCamera.cameraPermissionStatus === 'authorized'
      ? 'Camera'
      : 'Permissions',
  screens: {
    Permissions: PermissionsScreen,
    Camera: {
      screen: CameraScreen,
      options: {
        orientation: 'portrait_up',
      },
    },
    Photo: {
      screen: PhotoScreen,
      options: {
        animation: 'none',
        presentation: 'transparentModal',
      },
    },
    Video: {
      screen: VideoScreen,
      options: {
        animation: 'none',
        presentation: 'transparentModal',
      },
    },
  },
  screenOptions: {
    navigationBarHidden: true,
    headerShown: false,
    contentStyle: {
      backgroundColor: 'black',
    },
  },
})

type RootStackParamList = StaticParamList<typeof RootStack>

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

const Navigation = createStaticNavigation(RootStack)

function App({ grantPermissionsOnLaunch }: AppProps) {
  useEffect(() => {
    if (grantPermissionsOnLaunch !== true) {
      Alert.alert(
        'Permissions not granted',
        'Camera and microphone permissions have not been granted on launch. Please grant permissions to use the app.',
      )
      return;
    }

    VisionCamera.requestCameraPermission()
    VisionCamera.requestMicrophonePermission()
  }, [grantPermissionsOnLaunch])

  return (
    <GestureHandlerRootView>
      <Navigation />
    </GestureHandlerRootView>
  )
}

export default App
