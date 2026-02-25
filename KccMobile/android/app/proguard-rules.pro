# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# --- React Native ---
-keep,allowobfuscation @interface com.facebook.proguard.annotations.DoNotStrip
-keep,allowobfuscation @interface com.facebook.proguard.annotations.KeepGettersAndSetters
-keep @com.facebook.proguard.annotations.DoNotStrip class *
-keepclassmembers class * {
    @com.facebook.proguard.annotations.DoNotStrip *;
    @com.facebook.proguard.annotations.KeepGettersAndSetters *;
}
-keepclassmembers class * {
    @com.facebook.react.uimanager.annotations.ReactProp <methods>;
}
-dontwarn com.facebook.react.**

# Hermes
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.jni.** { *; }

# --- Firebase ---
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**

# --- Notifee ---
-keep class io.invertase.notifee.** { *; }
-dontwarn io.invertase.notifee.**

# --- VisionCamera ---
-keep class com.mrousavy.camera.** { *; }
-dontwarn com.mrousavy.camera.**

# --- MLKit Barcode Scanning ---
-keep class com.google.mlkit.vision.barcode.** { *; }
-dontwarn com.google.mlkit.vision.**

# --- react-native-webview ---
-keep class com.reactnativecommunity.webview.** { *; }
-dontwarn com.reactnativecommunity.webview.**

# --- react-native-config ---
-keep class com.lugg.RNCConfig.** { *; }

# --- OkHttp (used by many RN libraries) ---
-dontwarn okhttp3.**
-dontwarn okio.**

# --- General Android ---
-keepattributes *Annotation*
-keepattributes SourceFile,LineNumberTable
-keep public class * extends java.lang.Exception
