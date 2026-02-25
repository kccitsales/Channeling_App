# KccMobile 프로젝트 - Claude Code 공유 컨텍스트

> 이 파일은 여러 Claude Code 세션에서 공유되는 프로젝트 컨텍스트 문서입니다.
> 모든 세션은 이 파일을 읽고 이전 대화의 연장선에서 작업해야 합니다.
> **마지막 업데이트: 2026-02-25**

---

## 1. 프로젝트 개요

**KccMobile**은 KCC의 기존 웹사이트(WebSquare + Spring Boot)를 React Native WebView 하이브리드 앱으로 감싸는 프로젝트이다. 웹사이트를 WebView로 로드하고, 카메라(사진촬영 + QR스캔), GPS 위치, FCM 푸시 알림 기능을 네이티브로 구현한다.

- **프로젝트 경로**: `D:\kccfw\workspace_channeling\KccMobile`
- **운영 환경**: Windows 11 Pro (개발 머신)
- **대상 웹 URL**: `https://channeling.kccworld.co.kr/mobile/channeling/views/login/login_login.jsp` (로그인 화면이 시작점)
- **웹 프레임워크**: WebSquare (인스웨이브 시스템즈) + Spring Boot 백엔드
- **앱 타입**: WebView 하이브리드 (React Native)

---

## 2. 기술 스택

| 항목 | 버전/내용 |
|------|----------|
| React Native | 0.84.0 |
| React | 19.2.3 |
| TypeScript | 5.8.3 |
| Node.js | >= 22.11.0 |
| Kotlin | 2.1.20 |
| Android SDK | compileSdk 36, minSdk 24, targetSdk 36 |
| iOS | Swift, CocoaPods |
| 패키지 매니저 | npm (package-lock.json 사용) |
| 번들러 | Metro |
| JS 엔진 | Hermes (enabled) |
| New Architecture | 활성화됨 (Fabric + TurboModules) |

### 핵심 의존성

| 패키지 | 버전 | 용도 |
|--------|------|------|
| `react-native-webview` | ^13.16.0 | WebView 컴포넌트 |
| `react-native-vision-camera` | ^4.7.3 | 사진 촬영 + QR/바코드 스캔 |
| `react-native-geolocation-service` | ^5.3.1 | GPS 위치 조회 |
| `@react-native-firebase/app` | ^23.8.6 | Firebase 코어 |
| `@react-native-firebase/messaging` | ^23.8.6 | FCM 푸시 알림 |
| `@notifee/react-native` | ^9.1.8 | 로컬 알림 표시 |
| `react-native-config` | ^1.6.1 | 환경별 URL (.env) |
| `react-native-permissions` | ^5.4.4 | 권한 요청 통합 API |
| `react-native-fs` | ^2.20.0 | 파일 읽기 (사진 base64 변환) |
| `react-native-safe-area-context` | ^5.5.2 | Safe area 처리 |
| `patch-package` | ^8.0.1 (devDep) | node_modules 패치 영속화 |

---

## 3. 폴더 구조

```
KccMobile/
  .env, .env.development, .env.staging, .env.production   # 환경별 WEBVIEW_BASE_URL
  App.tsx                          # → src/App re-export
  index.js                         # 앱 엔트리 + FCM background handler
  patches/
    react-native-webview+13.16.0.patch  # Kakao API CORS 프록시 패치 (shouldInterceptRequest)
  src/
    App.tsx                        # 메인 앱 (WebView + Camera/QR 모달 관리)
    config/
      index.ts                     # APP_CONFIG.WEBVIEW_BASE_URL export
    bridge/
      types.ts                     # BridgeRequest, BridgeResponse, 각 액션별 타입
      BridgeHandler.ts             # 메시지 디스패처 (onMessage → 핸들러 라우팅)
      injectedJavaScript.ts        # window.KccBridge 주입 JS
    modules/
      camera/
        CameraScreen.tsx           # 사진 촬영 모달 (react-native-vision-camera)
        QRScannerScreen.tsx        # QR/바코드 스캔 모달 (useCodeScanner)
      location/
        locationService.ts         # getCurrentPosition 래퍼
      push/
        pushService.ts             # FCM 토큰, foreground/background 메시지 핸들링
    components/
      WebViewContainer.tsx         # WebView + 브릿지 통합 + 뒤로가기 + 로딩/에러
      LoadingScreen.tsx            # 로딩 스피너
      ErrorScreen.tsx              # 네트워크 에러 + 재시도 화면
    utils/
      permissions.ts               # requestCamera/Location/NotificationPermission
  android/
    app/src/main/AndroidManifest.xml   # CAMERA, LOCATION, POST_NOTIFICATIONS 권한
    build.gradle                       # google-services classpath 추가됨
    app/build.gradle                   # google-services + dotenv 플러그인 적용됨
  ios/
    KccMobile/Info.plist               # 카메라/위치 설명, UIBackgroundModes
    KccMobile/AppDelegate.swift        # Firebase.configure() + 푸시 설정
    Podfile                            # RNPermissions Camera/Location/Notifications pod
```

---

## 4. 아키텍처: 브릿지 프로토콜

웹(WebSquare)과 네이티브(React Native) 사이의 통신 구조:

### 흐름
```
[WebSquare JSP 페이지]
    ↓ KccBridge.call('ACTION', payload)
    ↓ window.ReactNativeWebView.postMessage(JSON)
[React Native WebView onMessage]
    ↓ BridgeHandler.onMessage() → 등록된 핸들러 실행
    ↓ 결과를 webViewRef.injectJavaScript()로 응답
[WebSquare JSP 페이지]
    ↓ KccBridge._onResponse() → Promise resolve/reject
```

### 메시지 형식

**Web → Native 요청:**
```json
{ "type": "CAMERA_CAPTURE", "requestId": "req_1_1708700000", "payload": { "quality": 0.8 } }
```

**Native → Web 응답:**
```json
{ "type": "CAMERA_CAPTURE", "requestId": "req_1_1708700000", "success": true, "data": { "imageBase64": "..." } }
```

### 지원 액션 목록

| type | 방향 | 설명 | 응답 data |
|------|------|------|-----------|
| `CAMERA_CAPTURE` | Web→Native | 사진 촬영 | `{ imageBase64: string }` |
| `QR_SCAN` | Web→Native | QR/바코드 스캔 | `{ value: string, format: string }` |
| `GET_LOCATION` | Web→Native | GPS 좌표 | `{ latitude, longitude, accuracy, altitude, speed, timestamp }` |
| `GET_PUSH_TOKEN` | Web→Native | FCM 토큰 | `{ token: string }` |
| `PUSH_RECEIVED` | Native→Web | 푸시 수신 이벤트 | CustomEvent `kccbridge:PUSH_RECEIVED` |

### 웹(WebSquare)에서 호출하는 법
```javascript
// JSP 페이지에서:
KccBridge.call('CAMERA_CAPTURE', { quality: 0.8 }).then(function(result) {
  // result.imageBase64
});
KccBridge.call('QR_SCAN').then(function(result) {
  // result.value, result.format
});
KccBridge.call('GET_LOCATION', { highAccuracy: true }).then(function(result) {
  // result.latitude, result.longitude
});
KccBridge.call('GET_PUSH_TOKEN').then(function(result) {
  // result.token
});
```

### 주요 구현 디테일
- `injectedJavaScriptBeforeContentLoaded` 사용 → 페이지 이동 시에도 KccBridge 재주입됨
- 요청 타임아웃: 30초
- Camera/QR은 React Native `Modal`로 전체화면 표시, 네비게이션 라이브러리 미사용
- BridgeHandler에서 Camera/QR 요청 시 Promise를 `_pendingCamera`/`_pendingQR`에 저장 → App.tsx의 모달 결과 콜백에서 resolve/reject
- **GET_LOCATION은 WebView 내장 `navigator.geolocation` API를 사용** (injectedJavaScript에서 직접 처리, 네이티브 모듈 거치지 않음). `react-native-geolocation-service`는 에뮬레이터에서 Fused Location Provider/LocationManager 타임아웃 이슈가 있어 WebView 내장 API로 전환함

---

## 5. 환경 설정

`.env` 파일의 현재 값:
```
WEBVIEW_BASE_URL=https://channeling.kccworld.co.kr/mobile/channeling/views/delivery/main_list.jsp
```
> **참고**: `.env` 변경 시 네이티브 빌드가 필요함 (Metro 리로드로는 반영 안 됨)

`src/config/index.ts`에서 `APP_CONFIG.WEBVIEW_BASE_URL`로 접근.

---

## 6. 네이티브 설정 현황

### Android
- `AndroidManifest.xml`: INTERNET, CAMERA, ACCESS_FINE_LOCATION, ACCESS_COARSE_LOCATION, POST_NOTIFICATIONS, VIBRATE 권한 추가됨
- `android/build.gradle`: `com.google.gms:google-services:4.4.2` classpath 추가됨
- `android/app/build.gradle`: `com.google.gms.google-services` 플러그인 + `dotenv.gradle` 적용됨
- App ID: `com.kccmobile`

### iOS
- `Info.plist`: NSCameraUsageDescription (카메라 설명), NSLocationWhenInUseUsageDescription (위치 설명), UIBackgroundModes (fetch, remote-notification) 추가됨
- `AppDelegate.swift`: `FirebaseApp.configure()`, `UNUserNotificationCenter`, `MessagingDelegate` 설정됨
- `Podfile`: `RNPermissions`, `Permission-Camera`, `Permission-LocationWhenInUse`, `Permission-Notifications` pod 추가됨
- Bundle ID: `org.reactjs.native.example.KccMobile` (Xcode 프로젝트 기본값, 배포 시 변경 필요)

### 아직 안 된 것 (수동 작업 필요)
- [ ] Firebase Console에서 프로젝트 생성 → 실제 `google-services.json` 교체 (현재 더미 파일)
- [ ] `GoogleService-Info.plist` → `ios/KccMobile/` 배치
- [ ] iOS `pod install` 실행
- [ ] iOS Bundle ID를 실제 값으로 변경
- [x] ~~Android 에뮬레이터 빌드~~ → 성공 (2026-02-23)
- [x] ~~WebView 로그인 페이지 로딩 + 로그인 테스트~~ → 정상 동작 확인 (2026-02-23)

### 빌드 관련 참고
- **Android SDK 경로**: `C:\Users\Administrator\AppData\Local\Android\Sdk` (`local.properties`에 설정됨)
- **JAVA_HOME**: `D:\kccfw\jdk-17.0.1`
- **에뮬레이터 AVD**: `Medium_Phone_API_36.1`
- **Gradle**: 9.0.0 (자동 다운로드됨)
- **실기기 테스트 기기**: M3SM15X (Android 10), serial: `1891373`
- **첫 빌드 시간**: ~11분 (이후 증분 빌드는 ~6분)
- Windows bash에서 `npx react-native run-android`는 `gradlew.bat` 경로 문제로 실패함 → `./gradlew app:installDebug` 직접 사용
- 실기기 + 에뮬레이터 동시 연결 시 특정 기기 지정: `adb -s 1891373 shell am start -n com.kccmobile/.MainActivity`

---

## 7. 코드 컨벤션 & 규칙

- **언어**: TypeScript strict mode (tsconfig는 @react-native/typescript-config 상속)
- **린트**: ESLint (@react-native/eslint-config), Prettier 2.8.8
- **import 경로**: 상대경로 사용 (`../bridge/types` 등). tsconfig에 `baseUrl: "."` + `paths: { "src/*": ["src/*"] }` 설정되어 있으나 babel module-resolver는 미적용 상태
- **컴포넌트**: 함수형 컴포넌트 + hooks 패턴
- **스타일**: StyleSheet.create 사용 (인라인 스타일 금지 - ESLint rule)
- **unused vars**: `_` 접두사 패턴 허용 (`_quality` 등)

---

## 8. 개발 히스토리 (작업 로그)

### 2026-02-23: 초기 하이브리드 앱 구조 구축
- React Native 0.84.0 보일러플레이트에서 시작
- 모든 핵심 패키지 설치 완료
- 폴더 구조 생성: `src/bridge/`, `src/modules/`, `src/components/`, `src/config/`, `src/utils/`
- 브릿지 프로토콜 구현 (types, BridgeHandler, injectedJavaScript)
- WebViewContainer 구현 (WebView + 브릿지 + 로딩/에러 + Android 뒤로가기)
- CameraScreen, QRScannerScreen 구현 (react-native-vision-camera v4)
- locationService 구현 (react-native-geolocation-service)
- pushService 구현 (Firebase messaging + Notifee)
- 권한 헬퍼 구현 (react-native-permissions)
- 메인 App.tsx: WebView + Camera/QR 모달 통합
- Android/iOS 네이티브 설정 (권한, Firebase, Podfile)
- `.env` 파일 생성, 실제 URL 설정: `https://channeling.kccworld.co.kr/mobile/channeling/views/login/login_login.jsp`
- TypeScript 컴파일 + ESLint 검증 통과

### 2026-02-23: Android 빌드 및 에뮬레이터 테스트
- `android/local.properties` 생성: `sdk.dir=C:\\Users\\Administrator\\AppData\\Local\\Android\\Sdk`
- `android/build.gradle`: buildToolsVersion `36.0.0` → `36.1.0` (설치된 버전에 맞춤), ndkVersion 주석 처리 (미설치)
- `android/app/build.gradle`: ndkVersion 참조 제거 (Gradle이 자동으로 NDK 27.0.12077973 설치함)
- `android/gradle.properties`: `VisionCamera_enableCodeScanner=true` 추가 (QR 스캔용)
- `android/app/google-services.json`: 더미 파일 생성 (Firebase 설정 전 빌드 에러 방지)
- `AndroidManifest.xml`: `xmlns:tools` 추가 + `tools:replace="android:value"` (firebase messaging 머지 충돌 해결)
- **Gradle 빌드 성공** (`BUILD SUCCESSFUL in 10m 58s, 281 tasks`)
- 에뮬레이터 `Medium_Phone_API_36.1`에 APK 설치 성공
- 앱 실행됨 (MainActivity 시작, 알림 권한 다이얼로그 표시됨)
- 에뮬레이터에서 WebView 로그인 페이지 로딩 성공, 로그인까지 정상 동작 확인

### 2026-02-23: Firebase 모듈형 API 마이그레이션 + GPS 디버깅
- `pushService.ts`, `index.js`: Firebase namespaced API → modular API 마이그레이션 (deprecation 경고 해결)
  - `messaging().*` → `getMessaging()`, `getToken(messaging)`, `requestPermission(messaging)`, `onMessage(messaging, ...)`, `setBackgroundMessageHandler(messaging, ...)`
- GPS 위치 테스트 (에뮬레이터): `react-native-geolocation-service`의 `getCurrentPosition`/`watchPosition` 모두 타임아웃
  - 원인: 에뮬레이터에서 Fused Location Provider가 앱에 좌표 전달 안 함 (dumpsys 확인: `locations = 0`)
  - LocationManager (`forceLocationManager: true`)도 에뮬레이터 GPS 시뮬레이션과 타이밍 문제
  - **해결**: GET_LOCATION을 WebView 내장 `navigator.geolocation` API로 전환 (injectedJavaScript에서 직접 처리)
  - `locationService.ts`는 네이티브 전용 fallback으로 유지
- WebViewContainer에 `geolocationEnabled={true}` 추가
- `src/config/index.ts`: fallback URL을 실제 운영 URL로 변경

### 2026-02-25: Kakao API CORS 프록시 패치 + WebView 호환성 개선
- **문제 발견**: 배송 상세 화면에서 5개 데이터 중 2개가 비어있음 → Kakao REST API CORS 실패
  - 웹사이트 JS(`chDeliveryDetailViewModal.js` 등)가 `dapi.kakao.com`에 `Authorization: KakaoAK` 헤더로 AJAX 요청
  - WebView에서 cross-origin 요청 시 Authorization 헤더가 CORS preflight에서 차단됨
  - 에러: `poFailCallBack is not a function` (실패 콜백이 undefined인데 호출 시도)
- **제약**: 운영 서버 코드 수정 불가 → **앱 네이티브 레벨에서 해결**
- **해결**: `react-native-webview`의 `RNCWebViewClient.java`에 `shouldInterceptRequest` 추가
  - `dapi.kakao.com` URL 요청을 감지하면 네이티브에서 직접 HttpsURLConnection으로 Kakao API 호출
  - Authorization 헤더를 네이티브에서 추가하고, CORS 헤더(`Access-Control-Allow-Origin: *`)를 붙여 응답 반환
  - SSL 인증서 검증 우회 (에뮬레이터 CA 인증서 이슈 - 추후 실기기에서 제거 검토)
  - `patch-package`로 패치 영속화: `patches/react-native-webview+13.16.0.patch`
- **WebViewContainer 설정 추가**:
  - `userAgent`: 모바일 Chrome UA로 설정 (서버가 일반 브라우저로 인식하도록)
  - `allowUniversalAccessFromFileURLs={true}`, `sharedCookiesEnabled={true}`, `thirdPartyCookiesEnabled={true}`
  - `webviewDebuggingEnabled={true}` (Chrome DevTools 원격 디버깅)
  - `originWhitelist={['https://*', 'http://*']}`
- `.env` URL 변경: 로그인 페이지 → 배송 메인 리스트 (테스트 편의)

### 2026-02-25: Material Symbols Outlined 폰트 미로딩 수정
- **문제**: JSP에서 `<span class="material-symbols-outlined">search</span>` 사용 시 WebView에서 돋보기 아이콘 대신 "search" 텍스트 표시
  - `common.css`의 CSS `@import url("https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:...")` 가 WebView에서 제대로 로드되지 않음
- **해결**: `injectedJavaScript.ts`에서 `<link rel="stylesheet">` 태그를 DOM에 직접 주입
  - CSS `@import` 대신 HTML `<link>` 태그가 WebView에서 더 안정적으로 동작

### 2026-02-25: 실기기 테스트 완료
- **테스트 기기**: M3SM15X (Android 10), adb serial: `1891373`
- **실기기 빌드 & 설치**: `gradlew app:installDebug` → 실기기 + 에뮬레이터 동시 설치 성공
- **포트 포워딩**: `adb -s 1891373 reverse tcp:8081 tcp:8081` (USB 디버그 빌드용)
- **Chrome DevTools 원격 디버깅**: `chrome://inspect/#devices` → WebView 콘솔에서 KccBridge 테스트
- **테스트 결과** (모두 성공):
  - `KccBridge.call('CAMERA_CAPTURE')` → 카메라 촬영 모달 정상 동작, base64 이미지 반환
  - `KccBridge.call('QR_SCAN')` → QR/바코드 스캔 모달 정상 동작, 스캔 결과 반환
  - `KccBridge.call('GET_LOCATION')` → GPS 좌표 정상 반환
  - `KccBridge.call('GET_PUSH_TOKEN')` → Firebase 더미 설정이라 API key 에러 (예상된 결과, 실제 google-services.json 교체 시 해결)
- **참고**: debug 빌드는 Metro 번들러(USB 연결) 필요. 독립 실행은 release 빌드로 진행해야 함

### 2026-02-25: Android Release 빌드 + 실기기 설치 성공
- **hermesc Windows 바이너리 누락 이슈**: `hermes-compiler@250829098.0.7`에 `win64-bin/hermesc.exe` 없음 → RN 0.84 알려진 이슈 ([#55538](https://github.com/facebook/react-native/issues/55538))
  - `hermes-compiler@0.15.1`의 hermesc.exe는 바이트코드 v96 생성 → 런타임이 v98 기대 → 크래시
  - **최종 해결**: `hermesc.cmd` 래퍼 스크립트로 바이트코드 컴파일 우회 (plain JS 번들 사용)
  - `android/hermesc.cmd`: 입력 JS를 그대로 출력으로 복사 + 빈 소스맵 생성
  - `build.gradle`의 `react { hermesCommand }`: Windows일 때 `$rootDir/hermesc.cmd` 사용
  - Hermes 런타임은 plain JS도 파싱 가능 → 기능 동일, 시작 시간만 약간 느림
- **Release AAB 빌드 성공**: `gradlew app:bundleRelease` → `BUILD SUCCESSFUL in 7m 35s`
  - 생성 파일: `android/app/build/outputs/bundle/release/app-release.aab` (47MB)
  - ProGuard/R8 minification 활성화됨 (`enableProguardInReleaseBuilds = true`)
  - 키스토어: `android/app/kccmobile-release.keystore` (alias: `kccmobile`)
- **bundletool을 이용한 AAB → APK 변환**: `bundletool-all-1.17.2.jar` 사용
  - `bundletool build-apks --connected-device --device-id=1891373` → 기기 맞춤 APK 생성 (27MB)
- **실기기 release APK 설치 성공**: `bundletool install-apks` → 앱 독립 실행 확인 (Metro 번들러 없이)
  - 기존 debug 빌드 서명 불일치로 `adb uninstall com.kccmobile` 후 재설치 필요했음
- **빌드 설정 요약**:
  - `versionCode`: 1, `versionName`: "1.0.0"
  - 서명 설정: `gradle.properties`에 키스토어 경로/비밀번호 저장
  - 지원 ABI: armeabi-v7a, arm64-v8a, x86, x86_64

---

## 9. 알려진 이슈 & 주의사항

1. **WebSquare 호환성**: WebSquare가 iframe 내에서 실행될 수 있음 → KccBridge가 top-level window에 접근 가능한지 실제 테스트 필요
2. **사진 용량**: base64 인코딩 시 용량이 큼 → quality 파라미터로 제어 의도였으나, react-native-vision-camera v4의 `takePhoto()`에는 quality 옵션이 없음. 현재 `_quality`로 미사용 처리. 필요 시 별도 이미지 리사이징 라이브러리 도입 검토
3. **Apple 심사**: Info.plist 권한 설명이 한글로 작성됨 → 다국어 지원 시 영문 설명도 추가 필요
4. **FCM background handler**: `index.js`에 등록됨 (컴포넌트 밖, 앱 시작 전 실행)
5. **Camera/QR pending promise**: BridgeHandler에 `_pendingCamera`/`_pendingQR`을 any 타입으로 저장하는 패턴 사용 중 → 향후 리팩터링 가능
6. **HTTPS**: 운영 URL이 HTTPS이므로 iOS ATS 이슈 없음. 개발 서버 HTTP 사용 시 `NSAllowsLocalNetworking: true` 활용
7. **GPS 에뮬레이터 한계**: `react-native-geolocation-service`는 Android 에뮬레이터(API 36)에서 Fused Location Provider/LocationManager 모두 타임아웃됨. WebView 내장 `navigator.geolocation`으로 전환하여 해결. 실기기에서는 네이티브 모듈도 정상 동작할 가능성 있음
8. **Kakao API 프록시 패치**: `shouldInterceptRequest`에서 SSL 인증서 검증을 우회(trust-all)하고 있음. 에뮬레이터 한정 이슈로 실기기에서는 정상 SSL 검증으로 변경 검토 필요
9. **서버 코드 수정 불가**: 운영 서버(`channeling.kccworld.co.kr`) 코드는 수정 권한 없음. 모든 WebView 호환성 이슈는 **앱 네이티브 레벨에서만 해결**해야 함
10. **웹 서버 프로젝트 경로**: `D:\kccfw\workspace\onlinemall` (로컬 Spring Boot 서버, 참조용 - `http://localhost:8702`)

---

## 10. 자주 쓰는 명령어

```bash
# 프로젝트 경로로 이동
cd "D:\kccfw\workspace_channeling\KccMobile"

# TypeScript 타입 체크
npx tsc --noEmit

# ESLint 검사
npx eslint src/ --ext .ts,.tsx

# Android 빌드 & 에뮬레이터 설치 (Windows - gradlew.bat 직접 실행)
"D:\kccfw\workspace_channeling\KccMobile\android\gradlew.bat" app:installDebug --project-dir="D:\kccfw\workspace_channeling\KccMobile\android"

# 에뮬레이터 앱 실행
"C:\Users\Administrator\AppData\Local\Android\Sdk\platform-tools\adb.exe" shell am start -n com.kccmobile/.MainActivity

# Metro 번들러 포트 포워딩 (에뮬레이터 ↔ 호스트)
"C:\Users\Administrator\AppData\Local\Android\Sdk\platform-tools\adb.exe" reverse tcp:8081 tcp:8081

# 에뮬레이터 실행
"C:\Users\Administrator\AppData\Local\Android\Sdk\emulator\emulator.exe" -avd Medium_Phone_API_36.1

# Metro 번들러 시작
npm start

# Android Release AAB 빌드
"D:\kccfw\workspace_channeling\KccMobile\android\gradlew.bat" app:bundleRelease --project-dir="D:\kccfw\workspace_channeling\KccMobile\android"

# AAB → APK 변환 (실기기용)
java -jar "D:\kccfw\workspace_channeling\KccMobile\bundletool.jar" build-apks --bundle="D:\kccfw\workspace_channeling\KccMobile\android\app\build\outputs\bundle\release\app-release.aab" --output="D:\kccfw\workspace_channeling\KccMobile\android\app\build\outputs\bundle\release\app-release.apks" --ks="D:\kccfw\workspace_channeling\KccMobile\android\app\kccmobile-release.keystore" --ks-pass=pass:kccmobile2026 --ks-key-alias=kccmobile --key-pass=pass:kccmobile2026 --connected-device --device-id=1891373 --adb="C:\Users\Administrator\AppData\Local\Android\Sdk\platform-tools\adb.exe" --overwrite

# Release APK 실기기 설치
java -jar "D:\kccfw\workspace_channeling\KccMobile\bundletool.jar" install-apks --apks="D:\kccfw\workspace_channeling\KccMobile\android\app\build\outputs\bundle\release\app-release.apks" --device-id=1891373 --adb="C:\Users\Administrator\AppData\Local\Android\Sdk\platform-tools\adb.exe"

# iOS 빌드 & 실행 (Mac에서)
cd ios && pod install && cd ..
npm run ios
```

---

## 11. 향후 작업 계획 (TODO)

- [ ] Firebase Console 프로젝트 생성 → 실제 `google-services.json` / `GoogleService-Info.plist` 교체
- [x] ~~Android 에뮬레이터 빌드 & WebView 로딩 테스트~~ → 완료
- [x] ~~Firebase modular API 마이그레이션~~ → 완료
- [x] ~~Kakao API CORS 문제 해결~~ → shouldInterceptRequest 패치로 해결
- [x] ~~Material Symbols 폰트 미로딩~~ → injectedJavaScript에서 link 태그 주입으로 해결
- [x] ~~실기기 카메라/QR/GPS 테스트~~ → 전부 성공 (M3SM15X, Android 10)
- [ ] Kakao API 프록시 패치 실기기 검증 (SSL trust-all 제거 가능한지 확인)
- [ ] Firebase Console 프로젝트 생성 → 실제 `google-services.json` 교체 후 푸시 테스트
- [x] ~~Android release 빌드 + 배포용 키스토어 생성~~ → 완료 (hermes-compiler 0.15.1 업그레이드 후 성공)
- [x] ~~Release APK 실기기 설치 테스트~~ → 완료 (bundletool로 AAB→APK 변환, 독립 실행 확인)
- [ ] Google Play Store 배포
- [ ] 이미지 리사이징/압축 처리 (base64 용량 최적화)
- [ ] 앱 아이콘 & 스플래시 화면 커스터마이징
- [ ] iOS 빌드 (Mac 환경) + pod install + 실기기 테스트
- [ ] iOS 배포용 인증서 생성 + App Store 배포
