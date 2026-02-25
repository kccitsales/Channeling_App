import React, {useRef, useCallback} from 'react';
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
} from 'react-native-vision-camera';
import RNFS from 'react-native-fs';

interface CameraScreenProps {
  quality?: number;
  onCapture: (imageBase64: string) => void;
  onClose: () => void;
}

export function CameraScreen({
  quality: _quality = 0.8,
  onCapture,
  onClose,
}: CameraScreenProps) {
  const cameraRef = useRef<Camera>(null);
  const device = useCameraDevice('back');
  const {hasPermission} = useCameraPermission();

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePhoto({
        flash: 'off',
      });
      const base64 = await RNFS.readFile(photo.path, 'base64');
      onCapture(base64);
    } catch (error) {
      console.error('[Camera] Capture error:', error);
    }
  }, [onCapture]);

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
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        photo={true}
      />
      <SafeAreaView style={styles.controls}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>취소</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.captureButton} onPress={handleCapture}>
          <View style={styles.captureButtonInner} />
        </TouchableOpacity>
        <View style={styles.placeholder} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
  },
  closeButton: {
    padding: 12,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  message: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
});
