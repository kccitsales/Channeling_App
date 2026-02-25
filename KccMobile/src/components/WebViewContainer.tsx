import React, {useRef, useCallback, useState, useEffect} from 'react';
import {BackHandler, Platform, StyleSheet} from 'react-native';
import WebView, {WebViewNavigation} from 'react-native-webview';
import {WebViewErrorEvent} from 'react-native-webview/lib/WebViewTypes';
import {INJECTED_JAVASCRIPT} from '../bridge/injectedJavaScript';
import {BridgeHandler} from '../bridge/BridgeHandler';
import {LoadingScreen} from './LoadingScreen';
import {ErrorScreen} from './ErrorScreen';
import {requestCameraPermission} from '../utils/permissions';
import {getCurrentPosition} from '../modules/location/locationService';
import {
  getPushToken,
  onForegroundMessage,
  displayLocalNotification,
} from '../modules/push/pushService';

interface WebViewContainerProps {
  url: string;
  onCameraRequest: (
    requestId: string,
    quality: number,
  ) => void;
  onQRScanRequest: (requestId: string) => void;
  bridgeHandlerRef: React.MutableRefObject<BridgeHandler | null>;
}

// 모바일 Chrome User-Agent를 사용하여 서버/API가 일반 브라우저로 인식하도록 함
const MOBILE_USER_AGENT =
  Platform.OS === 'android'
    ? 'Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36'
    : 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';

export function WebViewContainer({
  url,
  onCameraRequest,
  onQRScanRequest,
  bridgeHandlerRef,
}: WebViewContainerProps) {
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const canGoBackRef = useRef(false);

  useEffect(() => {
    const handler = new BridgeHandler(webViewRef);

    handler.registerHandler('CAMERA_CAPTURE', async payload => {
      console.log('[Bridge] CAMERA_CAPTURE received, requesting permission...');
      const perm = await requestCameraPermission();
      console.log('[Bridge] Camera permission result:', perm);
      if (perm !== 'granted') {
        throw new Error('Camera permission denied');
      }
      return new Promise((resolve, reject) => {
        const requestId = `cam_${Date.now()}`;
        console.log('[Bridge] Opening camera modal, requestId:', requestId);
        onCameraRequest(requestId, (payload.quality as number) ?? 0.8);
        (handler as any)._pendingCamera = {resolve, reject, requestId};
      });
    });

    handler.registerHandler('QR_SCAN', async () => {
      console.log('[Bridge] QR_SCAN received, requesting permission...');
      const perm = await requestCameraPermission();
      console.log('[Bridge] QR permission result:', perm);
      if (perm !== 'granted') {
        throw new Error('Camera permission denied');
      }
      return new Promise((resolve, reject) => {
        const requestId = `qr_${Date.now()}`;
        console.log('[Bridge] Opening QR modal, requestId:', requestId);
        onQRScanRequest(requestId);
        (handler as any)._pendingQR = {resolve, reject, requestId};
      });
    });

    handler.registerHandler('GET_LOCATION', async payload => {
      const result = await getCurrentPosition(
        (payload.highAccuracy as boolean) ?? true,
      );
      return result as unknown as Record<string, unknown>;
    });

    handler.registerHandler('GET_PUSH_TOKEN', async () => {
      const token = await getPushToken();
      return {token};
    });

    bridgeHandlerRef.current = handler;

    const unsubscribe = onForegroundMessage(async message => {
      if (message.notification) {
        await displayLocalNotification(
          message.notification.title ?? '',
          message.notification.body ?? '',
          message.data as Record<string, string> | undefined,
        );
      }
      handler.sendEvent('PUSH_RECEIVED', {
        title: message.notification?.title ?? '',
        body: message.notification?.body ?? '',
        data: message.data ?? {},
      });
    });

    return () => unsubscribe();
  }, [onCameraRequest, onQRScanRequest, bridgeHandlerRef]);

  // Android back button handling
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const onBackPress = () => {
      if (canGoBackRef.current && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress,
    );
    return () => subscription.remove();
  }, []);

  const handleNavigationStateChange = useCallback(
    (navState: WebViewNavigation) => {
      canGoBackRef.current = navState.canGoBack;
    },
    [],
  );

  const handleLoadEnd = useCallback(() => {
    setLoading(false);
  }, []);

  const handleError = useCallback((_event: WebViewErrorEvent) => {
    setError(true);
    setLoading(false);
  }, []);

  const handleRetry = useCallback(() => {
    setError(false);
    setLoading(true);
    webViewRef.current?.reload();
  }, []);

  const handleMessage = useCallback(
    (event: {nativeEvent: {data: string}}) => {
      bridgeHandlerRef.current?.onMessage(event.nativeEvent.data);
    },
    [bridgeHandlerRef],
  );

  if (error) {
    return <ErrorScreen onRetry={handleRetry} />;
  }

  return (
    <>
      <WebView
        ref={webViewRef}
        source={{uri: url}}
        style={styles.webview}
        injectedJavaScriptBeforeContentLoaded={INJECTED_JAVASCRIPT}
        onNavigationStateChange={handleNavigationStateChange}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
        geolocationEnabled={true}
        mixedContentMode="compatibility"
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        originWhitelist={['https://*', 'http://*']}
        userAgent={MOBILE_USER_AGENT}
        startInLoadingState={false}
        // Android 원격 디버깅 활성화
        webviewDebuggingEnabled={true}
      />
      {loading && <LoadingScreen />}
    </>
  );
}

const styles = StyleSheet.create({
  webview: {
    flex: 1,
  },
});
