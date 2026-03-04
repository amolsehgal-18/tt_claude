
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_auth_platform_interface/firebase_auth_platform_interface.dart';
import 'package:firebase_core_platform_interface/firebase_core_platform_interface.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/mockito.dart';

// Mock implementation of FirebaseAuthPlatform
class MockFirebaseAuthPlatform extends Mock implements FirebaseAuthPlatform {}

// Mock implementation of MethodChannelFirebase
class MockMethodChannelFirebase extends Mock implements MethodChannelFirebase {}

// Function to set up the mock Firebase authentication
void setupFirebaseAuthMocks() {
  TestWidgetsFlutterBinding.ensureInitialized();

  // Mock the Firebase Core platform channel
  final MockMethodChannelFirebase coreMock = MockMethodChannelFirebase();
  Firebase.delegatePackingProperty = coreMock;
  when(coreMock.initializeApp(
    name: anyNamed('name'),
    options: anyNamed('options'),
  )).thenAnswer((_) async => MockFirebaseAppPlatform());

  // Mock the Firebase Auth platform channel
  final MockFirebaseAuthPlatform authMock = MockFirebaseAuthPlatform();
  FirebaseAuthPlatform.instance = authMock;
  when(authMock.authStateChanges()).thenAnswer((_) => const Stream.empty());
  when(authMock.currentUser).thenReturn(null);
  when(authMock.signInAnonymously())
      .thenAnswer((_) async => MockUserCredentialPlatform());
}

// Mock implementation of FirebaseAppPlatform
class MockFirebaseAppPlatform extends Mock implements FirebaseAppPlatform {}

// Mock implementation of UserCredentialPlatform
class MockUserCredentialPlatform extends Mock implements UserCredentialPlatform {}

// Mock implementation of FirebaseApp
class MockFirebaseApp extends Mock implements FirebaseApp {}

// Mock implementation of UserCredential
class MockUserCredential extends Mock implements UserCredential {
  @override
  User? get user => MockUser();
}

// Mock implementation of User
class MockUser extends Mock implements User {
  @override
  final String uid = 'mock_uid';
  @override
  final bool isAnonymous = true;
}
