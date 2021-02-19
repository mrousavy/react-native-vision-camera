import 'react-native-gesture-handler';
import { Navigation } from "react-native-navigation";
import { gestureHandlerRootHOC } from 'react-native-gesture-handler';
import { App } from './src/App';
import { Settings } from './src/Settings';
import { Splash } from './src/Splash';
import { Media } from './src/Media';

Navigation.setDefaultOptions({
  topBar: {
    visible: false,
  },
});

Navigation.registerComponent('Splash', () => gestureHandlerRootHOC(Splash), () => Splash);
Navigation.registerComponent('Home', () => gestureHandlerRootHOC(App), () => App);
Navigation.registerComponent('Media', () => gestureHandlerRootHOC(Media), () => Media);
Navigation.registerComponent('Settings', () => gestureHandlerRootHOC(Settings), () => Settings);

Navigation.events().registerAppLaunchedListener(() => {
   Navigation.setRoot({
     root: {
       stack: {
         children: [
           {
             component: {
               name: 'Splash'
             }
           }
         ]
       }
     }
  });
});
