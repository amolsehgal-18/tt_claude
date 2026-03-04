import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';
import 'package:flutter/foundation.dart';

export 'package:firebase_auth/firebase_auth.dart' show User;

class AuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final GoogleSignIn _googleSignIn = GoogleSignIn();

  /// Currently signed-in user, or null if guest/unauthenticated.
  User? get currentUser => _auth.currentUser;

  /// Stream that fires whenever the auth state changes.
  Stream<User?> get authStateChanges => _auth.authStateChanges();

  /// True if any user is signed in (including anonymous guests).
  bool get isSignedIn => _auth.currentUser != null;

  /// Sign in with Google. Throws a descriptive [AuthException] on failure.
  Future<User?> signInWithGoogle() async {
    try {
      final googleUser = await _googleSignIn.signIn();
      if (googleUser == null) return null; // user cancelled

      final googleAuth = await googleUser.authentication;
      final credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );
      final result = await _auth.signInWithCredential(credential);
      return result.user;
    } on FirebaseAuthException catch (e) {
      throw _mapFirebaseError(e);
    } catch (e) {
      throw const AuthException('Google sign-in failed. Please try again.');
    }
  }

  /// Sign in with Apple (iOS / macOS only). Throws [AuthException] on failure.
  Future<User?> signInWithApple() async {
    try {
      final appleCredential = await SignInWithApple.getAppleIDCredential(
        scopes: [
          AppleIDAuthorizationScopes.email,
          AppleIDAuthorizationScopes.fullName,
        ],
      );

      final oauthCredential = OAuthProvider('apple.com').credential(
        idToken: appleCredential.identityToken,
        accessToken: appleCredential.authorizationCode,
      );

      final result = await _auth.signInWithCredential(oauthCredential);
      return result.user;
    } on FirebaseAuthException catch (e) {
      throw _mapFirebaseError(e);
    } on SignInWithAppleAuthorizationException catch (e) {
      if (e.code == AuthorizationErrorCode.canceled) return null;
      throw AuthException('Apple sign-in failed: ${e.message}');
    } catch (e) {
      throw const AuthException('Apple sign-in failed. Please try again.');
    }
  }

  /// Sign in anonymously so the player can play without creating an account.
  Future<User?> signInAsGuest() async {
    try {
      final result = await _auth.signInAnonymously();
      return result.user;
    } on FirebaseAuthException catch (e) {
      throw _mapFirebaseError(e);
    } catch (e) {
      throw const AuthException('Could not start guest session. Please try again.');
    }
  }

  /// Signs out the current user (including anonymous sessions).
  Future<void> signOut() async {
    try {
      await Future.wait([
        _auth.signOut(),
        _googleSignIn.signOut(),
      ]);
    } catch (e) {
      debugPrint('AuthService: sign-out error — $e');
    }
  }

  AuthException _mapFirebaseError(FirebaseAuthException e) {
    switch (e.code) {
      case 'network-request-failed':
        return const AuthException('No internet connection. Please check your network.');
      case 'account-exists-with-different-credential':
        return const AuthException('An account already exists with this email using a different sign-in method.');
      case 'invalid-credential':
        return const AuthException('Sign-in failed. Please try again.');
      case 'operation-not-allowed':
        return const AuthException('This sign-in method is not enabled. Please contact support.');
      case 'user-disabled':
        return const AuthException('This account has been disabled.');
      default:
        return AuthException(e.message ?? 'Authentication failed. Please try again.');
    }
  }
}

class AuthException implements Exception {
  final String message;
  const AuthException(this.message);

  @override
  String toString() => message;
}
