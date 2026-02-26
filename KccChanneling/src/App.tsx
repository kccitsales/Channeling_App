import React, {useRef, useCallback, useState, useEffect} from 'react';
import {Modal, StatusBar, useColorScheme} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {APP_CONFIG} from './config';
import {WebViewContainer} from './components/WebViewContainer';
import {CameraScreen} from './modules/camera/CameraScreen';
import {QRScannerScreen} from './modules/camera/QRScannerScreen';
import {BridgeHandler} from './bridge/BridgeHandler';
import {requestPushPermission} from './modules/push/pushService';

type ActiveModal =
  | {type: 'none'}
  | {type: 'camera'; requestId: string; quality: number}
  | {type: 'qr'; requestId: string};

export default function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const bridgeHandlerRef = useRef<BridgeHandler | null>(null);
  const [activeModal, setActiveModal] = useState<ActiveModal>({type: 'none'});

  useEffect(() => {
    requestPushPermission().catch(() => {});
  }, []);

  const handleCameraRequest = useCallback(
    (requestId: string, quality: number) => {
      setActiveModal({type: 'camera', requestId, quality});
    },
    [],
  );

  const handleQRScanRequest = useCallback((requestId: string) => {
    setActiveModal({type: 'qr', requestId});
  }, []);

  const handleCameraCapture = useCallback(
    (imageBase64: string) => {
      setActiveModal({type: 'none'});
      const handler = bridgeHandlerRef.current as any;
      if (handler?._pendingCamera) {
        handler._pendingCamera.resolve({imageBase64});
        handler._pendingCamera = null;
      }
    },
    [],
  );

  const handleQRScan = useCallback(
    (value: string, format: string) => {
      setActiveModal({type: 'none'});
      const handler = bridgeHandlerRef.current as any;
      if (handler?._pendingQR) {
        handler._pendingQR.resolve({value, format});
        handler._pendingQR = null;
      }
    },
    [],
  );

  const handleModalClose = useCallback(() => {
    const handler = bridgeHandlerRef.current as any;
    if (activeModal.type === 'camera' && handler?._pendingCamera) {
      handler._pendingCamera.reject(new Error('Camera cancelled'));
      handler._pendingCamera = null;
    }
    if (activeModal.type === 'qr' && handler?._pendingQR) {
      handler._pendingQR.reject(new Error('QR scan cancelled'));
      handler._pendingQR = null;
    }
    setActiveModal({type: 'none'});
  }, [activeModal]);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <WebViewContainer
        url={APP_CONFIG.WEBVIEW_BASE_URL}
        onCameraRequest={handleCameraRequest}
        onQRScanRequest={handleQRScanRequest}
        bridgeHandlerRef={bridgeHandlerRef}
      />

      <Modal
        visible={activeModal.type === 'camera'}
        animationType="slide"
        presentationStyle="fullScreen">
        {activeModal.type === 'camera' && (
          <CameraScreen
            quality={activeModal.quality}
            onCapture={handleCameraCapture}
            onClose={handleModalClose}
          />
        )}
      </Modal>

      <Modal
        visible={activeModal.type === 'qr'}
        animationType="slide"
        presentationStyle="fullScreen">
        {activeModal.type === 'qr' && (
          <QRScannerScreen
            onScan={handleQRScan}
            onClose={handleModalClose}
          />
        )}
      </Modal>
    </SafeAreaProvider>
  );
}
