import Geolocation from 'react-native-geolocation-service';
import {Platform} from 'react-native';
import {requestLocationPermission} from '../../utils/permissions';
import type {GetLocationResult} from '../../bridge/types';

export async function getCurrentPosition(
  highAccuracy = true,
): Promise<GetLocationResult> {
  const permission = await requestLocationPermission();
  if (permission !== 'granted') {
    throw new Error('Location permission denied');
  }

  // Use watchPosition and resolve on first result - more reliable on emulators
  return new Promise((resolve, reject) => {
    let resolved = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const watchId = Geolocation.watchPosition(
      position => {
        if (resolved) {
          return;
        }
        resolved = true;
        clearTimeout(timeoutId);
        Geolocation.clearWatch(watchId);
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          speed: position.coords.speed,
          timestamp: position.timestamp,
        });
      },
      error => {
        if (resolved) {
          return;
        }
        resolved = true;
        clearTimeout(timeoutId);
        Geolocation.clearWatch(watchId);
        reject(new Error(`Location error: ${error.message}`));
      },
      {
        enableHighAccuracy: highAccuracy,
        distanceFilter: 0,
        interval: 1000,
        fastestInterval: 500,
        showLocationDialog: true,
        forceRequestLocation: true,
        forceLocationManager: Platform.OS === 'android',
      },
    );

    // Manual timeout fallback
    timeoutId = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        Geolocation.clearWatch(watchId);
        reject(new Error('Location request timed out'));
      }
    }, 25000);
  });
}
