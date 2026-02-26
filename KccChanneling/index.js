/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import {
  getMessaging,
  setBackgroundMessageHandler,
} from '@react-native-firebase/messaging';
import notifee from '@notifee/react-native';

// FCM background message handler (must be registered outside of component)
const messaging = getMessaging();
setBackgroundMessageHandler(messaging, async remoteMessage => {
  if (remoteMessage.notification) {
    await notifee.displayNotification({
      title: remoteMessage.notification.title ?? '',
      body: remoteMessage.notification.body ?? '',
      data: remoteMessage.data,
      android: {
        channelId: 'kcc_default',
        smallIcon: 'ic_launcher',
        pressAction: {id: 'default'},
      },
    });
  }
});

AppRegistry.registerComponent(appName, () => App);
