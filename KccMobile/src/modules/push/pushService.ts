import {
  getMessaging,
  getToken,
  requestPermission,
  onMessage,
  setBackgroundMessageHandler,
  AuthorizationStatus,
} from '@react-native-firebase/messaging';
import type {FirebaseMessagingTypes} from '@react-native-firebase/messaging';
import notifee, {AndroidImportance} from '@notifee/react-native';
import {Platform} from 'react-native';
import {requestNotificationPermission} from '../../utils/permissions';

const CHANNEL_ID = 'kcc_default';

async function ensureNotificationChannel() {
  if (Platform.OS === 'android') {
    await notifee.createChannel({
      id: CHANNEL_ID,
      name: 'KCC 알림',
      importance: AndroidImportance.HIGH,
    });
  }
}

export async function requestPushPermission(): Promise<boolean> {
  await requestNotificationPermission();

  const messaging = getMessaging();
  const authStatus = await requestPermission(messaging);
  return (
    authStatus === AuthorizationStatus.AUTHORIZED ||
    authStatus === AuthorizationStatus.PROVISIONAL
  );
}

export async function getPushToken(): Promise<string> {
  const permitted = await requestPushPermission();
  if (!permitted) {
    throw new Error('Push notification permission denied');
  }
  const messaging = getMessaging();
  return getToken(messaging);
}

export async function displayLocalNotification(
  title: string,
  body: string,
  data?: Record<string, string>,
) {
  await ensureNotificationChannel();
  await notifee.displayNotification({
    title,
    body,
    data,
    android: {
      channelId: CHANNEL_ID,
      smallIcon: 'ic_launcher',
      pressAction: {id: 'default'},
    },
  });
}

export type PushMessageListener = (
  message: FirebaseMessagingTypes.RemoteMessage,
) => void;

export function onForegroundMessage(listener: PushMessageListener) {
  const messaging = getMessaging();
  return onMessage(messaging, listener);
}

export function setupBackgroundHandler() {
  const messaging = getMessaging();
  setBackgroundMessageHandler(messaging, async remoteMessage => {
    if (remoteMessage.notification) {
      await displayLocalNotification(
        remoteMessage.notification.title ?? '',
        remoteMessage.notification.body ?? '',
        remoteMessage.data as Record<string, string> | undefined,
      );
    }
  });
}
