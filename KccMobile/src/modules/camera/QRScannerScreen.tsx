import React, {useCallback} from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner,
} from 'react-native-vision-camera';

interface QRScannerScreenProps {
  onScan: (value: string, format: string) => void;
  onClose: () => void;
}

export function QRScannerScreen({onScan, onClose}: QRScannerScreenProps) {
  const device = useCameraDevice('back');
  const {hasPermission} = useCameraPermission();

  const codeScanner = useCodeScanner({
    codeTypes: ['qr', 'ean-13', 'ean-8', 'code-128', 'code-39', 'code-93'],
    onCodeScanned: useCallback(
      (codes) => {
        if (codes.length > 0 && codes[0].value) {
          onScan(codes[0].value, codes[0].type);
        }
      },
      [onScan],
    ),
  });

  if (!hasPermission) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.message}>카메라 권한이 필요합니다.</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>닫기</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!device) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.message}>카메라를 사용할 수 없습니다.</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>닫기</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        codeScanner={codeScanner}
      />
      <View style={styles.overlay}>
        <View style={styles.scanArea} />
      </View>
      <SafeAreaView style={styles.controls}>
        <Text style={styles.guideText}>QR 코드 또는 바코드를 화면에 맞춰주세요</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>닫기</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: 60,
  },
  guideText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  message: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
});
