import {Platform} from 'react-native';
import {
  check,
  request,
  requestNotifications,
  checkNotifications,
  PERMISSIONS,
  RESULTS,
  Permission,
} from 'react-native-permissions';

type PermissionResult = 'granted' | 'denied' | 'blocked';

async function requestPermission(
  permission: Permission,
): Promise<PermissionResult> {
  const status = await check(permission);
  if (status === RESULTS.GRANTED || status === RESULTS.LIMITED) {
    return 'granted';
  }
  if (status === RESULTS.BLOCKED || status === RESULTS.UNAVAILABLE) {
    return 'blocked';
  }
  const result = await request(permission);
  if (result === RESULTS.GRANTED || result === RESULTS.LIMITED) {
    return 'granted';
  }
  if (result === RESULTS.BLOCKED) {
    return 'blocked';
  }
  return 'denied';
}

export async function requestCameraPermission(): Promise<PermissionResult> {
  const permission = Platform.select({
    android: PERMISSIONS.ANDROID.CAMERA,
    ios: PERMISSIONS.IOS.CAMERA,
  });
  if (!permission) return 'denied';
  return requestPermission(permission);
}

export async function requestLocationPermission(): Promise<PermissionResult> {
  const permission = Platform.select({
    android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
    ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
  });
  if (!permission) return 'denied';
  return requestPermission(permission);
}

export async function requestNotificationPermission(): Promise<PermissionResult> {
  const {status} = await checkNotifications();
  if (status === RESULTS.GRANTED) {
    return 'granted';
  }
  if (status === RESULTS.BLOCKED) {
    return 'blocked';
  }
  const result = await requestNotifications(['alert', 'badge', 'sound']);
  if (result.status === RESULTS.GRANTED) {
    return 'granted';
  }
  if (result.status === RESULTS.BLOCKED) {
    return 'blocked';
  }
  return 'denied';
}
