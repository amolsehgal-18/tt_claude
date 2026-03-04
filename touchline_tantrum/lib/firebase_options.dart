// Generated from Firebase project: studio-3702759365-fe51c
// Android is fully configured. For iOS/macOS/Web, run:
//   flutterfire configure --project=studio-3702759365-fe51c
// after installing Flutter and the FlutterFire CLI.

import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) return web;
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      case TargetPlatform.macOS:
        return macos;
      case TargetPlatform.windows:
        return windows;
      default:
        throw UnsupportedError(
          'DefaultFirebaseOptions are not configured for this platform.',
        );
    }
  }

  // ✅ Android — fully configured from google-services.json
  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyCiXs4LLAkfJE-TaJvDSGE9RwjCuFpH-ns',
    appId: '1:364508519543:android:e79a03a19cb0a8e94b7a72',
    messagingSenderId: '364508519543',
    projectId: 'studio-3702759365-fe51c',
    storageBucket: 'studio-3702759365-fe51c.firebasestorage.app',
  );

  // ⚠️ iOS — run `flutterfire configure` to fill in the real API key,
  // or download GoogleService-Info.plist from Firebase Console and extract it.
  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'REPLACE_WITH_IOS_API_KEY',
    appId: '1:364508519543:ios:0bfbe7c3a2415ec24b7a72',
    messagingSenderId: '364508519543',
    projectId: 'studio-3702759365-fe51c',
    storageBucket: 'studio-3702759365-fe51c.firebasestorage.app',
    iosClientId: 'REPLACE_WITH_IOS_CLIENT_ID',
    iosBundleId: 'com.example.touchlineTantrum',
  );

  // ⚠️ macOS — run `flutterfire configure` to fill in
  static const FirebaseOptions macos = FirebaseOptions(
    apiKey: 'REPLACE_WITH_MACOS_API_KEY',
    appId: '1:364508519543:ios:64e43658134b33634b7a72',
    messagingSenderId: '364508519543',
    projectId: 'studio-3702759365-fe51c',
    storageBucket: 'studio-3702759365-fe51c.firebasestorage.app',
    iosClientId: 'REPLACE_WITH_MACOS_CLIENT_ID',
    iosBundleId: 'com.example.touchlineTantrum',
  );

  // ⚠️ Web — run `flutterfire configure` to fill in
  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'REPLACE_WITH_WEB_API_KEY',
    appId: '1:364508519543:web:919c574f2ceaead24b7a72',
    messagingSenderId: '364508519543',
    projectId: 'studio-3702759365-fe51c',
    storageBucket: 'studio-3702759365-fe51c.firebasestorage.app',
    authDomain: 'studio-3702759365-fe51c.firebaseapp.com',
  );

  // ⚠️ Windows — run `flutterfire configure` to fill in
  static const FirebaseOptions windows = FirebaseOptions(
    apiKey: 'REPLACE_WITH_WINDOWS_API_KEY',
    appId: '1:364508519543:web:1d6b90369d382a094b7a72',
    messagingSenderId: '364508519543',
    projectId: 'studio-3702759365-fe51c',
    storageBucket: 'studio-3702759365-fe51c.firebasestorage.app',
    authDomain: 'studio-3702759365-fe51c.firebaseapp.com',
  );
}
