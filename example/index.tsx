import { Navigation } from "react-native-navigation";
import App from './src/App';
import Settings from './src/Settings';

Navigation.registerComponent('Home', () => App);
Navigation.registerComponent('Settings', () => Settings);

Navigation.events().registerAppLaunchedListener(() => {
   Navigation.setRoot({
     root: {
       stack: {
         children: [
           {
             component: {
               name: 'Home'
             }
           }
         ]
       }
     }
  });
});
