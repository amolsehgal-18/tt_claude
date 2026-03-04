import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_auth_platform_interface/firebase_auth_platform_interface.dart';
import 'package:firebase_core_platform_interface/firebase_core_platform_interface.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/mockito.dart';

class MockFirebaseAuthPlatform extends Mock implements FirebaseAuthPlatform {
  @override
  Stream<UserPlatform?> authStateChanges() => const Stream.empty();
  @override
  UserPlatform? get currentUser => null;
}

class MockFirebaseAppPlatform extends Mock implements FirebaseAppPlatform {}

class MockUserCredentialPlatform extends Mock
    implements UserCredentialPlatform {}

class MockUserCredential extends Mock implements UserCredential {
  @override
  User? get user => MockUser();
}

class MockUser extends Mock implements User {
  @override
  final String uid = 'mock_uid';
  @override
  final bool isAnonymous = true;
  @override
  final String? email = null;
  @override
  final String? displayName = null;
  @override
  final String? photoURL = null;
}

/// Sets up minimal mocks so tests can run without real Firebase platform channels.
void setupFirebaseAuthMocks() {
  TestWidgetsFlutterBinding.ensureInitialized();

  // Stub the Firebase Auth platform so authStateChanges() returns an empty stream
  FirebaseAuthPlatform.instance = MockFirebaseAuthPlatform();
}
