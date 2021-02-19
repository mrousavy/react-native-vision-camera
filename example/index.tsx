import 'react-native-gesture-handler';
import { Navigation } from "react-native-navigation";
import { gestureHandlerRootHOC } from 'react-native-gesture-handler';
import App from './src/App';
import Settings from './src/Settings';
import Splash from './src/Splash';


Navigation.registerComponent('Splash', () => gestureHandlerRootHOC(Splash), () => Splash);
Navigation.registerComponent('Home', () => gestureHandlerRootHOC(App), () => App);
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
