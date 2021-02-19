import 'react-native-gesture-handler';
import { Navigation } from "react-native-navigation";
import { gestureHandlerRootHOC } from 'react-native-gesture-handler';
import { App } from './src/App';
import { Settings } from './src/Settings';
import { Splash } from './src/Splash';
import { Media } from './src/Media';
import { Camera } from 'react-native-vision-camera';

Navigation.setDefaultOptions({
  topBar: {
    visible: false,
  },
  window: {
    backgroundColor: 'black',
  },
  layout: {
    backgroundColor: 'black',
    componentBackgroundColor: 'black'
  },
});

Navigation.registerComponent('Splash', () => gestureHandlerRootHOC(Splash), () => Splash);
Navigation.registerComponent('Home', () => gestureHandlerRootHOC(App), () => App);
Navigation.registerComponent('Media', () => gestureHandlerRootHOC(Media), () => Media);
Navigation.registerComponent('Settings', () => gestureHandlerRootHOC(Settings), () => Settings);

Navigation.events().registerNavigationButtonPressedListener((event) => {
  if (event.buttonId === "back") {
    Navigation.pop(event.componentId);
  }
});

Navigation.events().registerAppLaunchedListener(async () => {
  const [cameraPermission, microphonePermission] = await Promise.all([
    Camera.getCameraPermissionStatus(),
    Camera.getMicrophonePermissionStatus(),
  ]);
  let rootName = "Splash";
  if (cameraPermission === "authorized" && microphonePermission === "authorized") {
    rootName = "Home";
  }

  Navigation.setRoot({
    root: {
      stack: {
        children: [
          {
            component: {
              name: rootName
            }
          }
        ]
      }
    }
  });
});
