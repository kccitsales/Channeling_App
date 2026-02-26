import Config from 'react-native-config';

export const APP_CONFIG = {
  WEBVIEW_BASE_URL:
    Config.WEBVIEW_BASE_URL ??
    'https://channeling.kccworld.co.kr/mobile/channeling/views/login/login_login.jsp',
} as const;
