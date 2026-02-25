import WebView from 'react-native-webview';
import {BridgeRequest, BridgeResponse, BridgeActionType} from './types';

type ActionHandler = (
  payload: Record<string, unknown>,
) => Promise<Record<string, unknown>>;

export class BridgeHandler {
  private webViewRef: React.RefObject<WebView<object> | null>;
  private handlers: Map<BridgeActionType, ActionHandler> = new Map();

  constructor(webViewRef: React.RefObject<WebView<object> | null>) {
    this.webViewRef = webViewRef;
  }

  registerHandler(type: BridgeActionType, handler: ActionHandler) {
    this.handlers.set(type, handler);
  }

  async onMessage(messageData: string) {
    let request: BridgeRequest;
    try {
      request = JSON.parse(messageData);
    } catch {
      console.warn('[Bridge] Invalid message:', messageData);
      return;
    }

    const {type, requestId, payload} = request;
    console.log('[Bridge] onMessage received:', type, requestId);
    const handler = this.handlers.get(type);

    if (!handler) {
      this.sendResponse({
        type,
        requestId,
        success: false,
        error: `Unknown action: ${type}`,
      });
      return;
    }

    try {
      const data = await handler(payload ?? {});
      this.sendResponse({type, requestId, success: true, data});
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error';
      this.sendResponse({type, requestId, success: false, error: message});
    }
  }

  sendResponse(response: BridgeResponse) {
    const js = `window.KccBridge._onResponse(${JSON.stringify(response)});`;
    this.webViewRef.current?.injectJavaScript(js);
  }

  sendEvent(type: BridgeActionType, data: Record<string, unknown>) {
    const js = `window.KccBridge._onEvent('${type}', ${JSON.stringify(data)});`;
    this.webViewRef.current?.injectJavaScript(js);
  }
}
