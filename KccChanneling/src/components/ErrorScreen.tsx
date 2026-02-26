import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';

interface ErrorScreenProps {
  onRetry: () => void;
}

export function ErrorScreen({onRetry}: ErrorScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>연결할 수 없습니다</Text>
      <Text style={styles.message}>
        네트워크 연결을 확인한 후 다시 시도해 주세요.
      </Text>
      <TouchableOpacity style={styles.button} onPress={onRetry}>
        <Text style={styles.buttonText}>다시 시도</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  message: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#0066CC',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
