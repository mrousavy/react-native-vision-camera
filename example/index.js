import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import { App } from './src/App';

AppRegistry.registerComponent('VisionCameraExample', () => App);

// Navigation.setDefaultOptions({
//   topBar: {
//     visible: false,
//   },
//   window: {
//     backgroundColor: 'black',
//   },
//   layout: {
//     backgroundColor: 'black',
//     componentBackgroundColor: 'black',
//   },
//   statusBar: {
//     animated: true,
//     drawBehind: true,
//     translucent: true,
//     visible: true,
//     style: 'dark',
//   },
//   animations: {
//     setRoot: {
//       alpha: {
//         duration: 500,
//         from: 0,
//         to: 1,
//       },
//     },
//   },
// });

// Navigation.registerComponent(
//   'Splash',
//   () => gestureHandlerRootHOC(Splash),
//   () => Splash,
// );
// Navigation.registerComponent(
//   'CameraPage',
//   () => gestureHandlerRootHOC(CameraPage),
//   () => CameraPage,
// );
// Navigation.registerComponent(
//   'MediaPage',
//   () => gestureHandlerRootHOC(MediaPage),
//   () => MediaPage,
// );

// Navigation.events().registerNavigationButtonPressedListener((event) => {
//   if (event.buttonId === 'back') Navigation.pop(event.componentId);
// });

// Navigation.events().registerAppLaunchedListener(async () => {
//   const [cameraPermission, microphonePermission] = await Promise.all([
//     Camera.getCameraPermissionStatus(),
//     Camera.getMicrophonePermissionStatus(),
//   ]);
//   let rootName = 'Splash';
//   if (cameraPermission === 'authorized' && microphonePermission === 'authorized') rootName = 'CameraPage';

//   Navigation.setRoot({
//     root: {
//       stack: {
//         children: [
//           {
//             component: {
//               name: rootName,
//             },
//           },
//         ],
//       },
//     },
//   });
// });
