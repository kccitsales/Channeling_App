export type BridgeActionType =
  | 'CAMERA_CAPTURE'
  | 'QR_SCAN'
  | 'GET_LOCATION'
  | 'GET_PUSH_TOKEN'
  | 'PUSH_RECEIVED';

export interface BridgeRequest {
  type: BridgeActionType;
  requestId: string;
  payload?: Record<string, unknown>;
}

export interface BridgeResponse {
  type: BridgeActionType;
  requestId: string;
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

export interface CameraCapturePayload {
  quality?: number;
}

export interface CameraCaptureResult {
  imageBase64: string;
}

export interface QRScanResult {
  value: string;
  format: string;
}

export interface GetLocationPayload {
  highAccuracy?: boolean;
}

export interface GetLocationResult {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  speed: number | null;
  timestamp: number;
}

export interface PushTokenResult {
  token: string;
}

export interface PushReceivedData {
  title?: string;
  body?: string;
  data?: Record<string, string>;
}
