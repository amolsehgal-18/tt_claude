
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:touchline_tantrum/screens/auth_screen.dart';
import './mock_firebase.dart';

// Import the mock Firebase setup

void main() {
  // Set up the mock Firebase services before any tests run.
  setupFirebaseAuthMocks();

  // Initialize the mock Firebase app before each test.
  setUpAll(() async {
    await Firebase.initializeApp();
  });

  testWidgets('AuthScreen has a title and sign in options', (WidgetTester tester) async {
    // Build the AuthScreen widget directly, wrapped in a MaterialApp.
    await tester.pumpWidget(const MaterialApp(
      home: AuthScreen(),
    ));

    // The first frame might be a loading indicator or other async operations,
    // so we pump and settle to wait for the UI to stabilize.
    await tester.pumpAndSettle();

    // Verify that the main title is present.
    expect(find.text('TOUCHLINE'), findsOneWidget);
    expect(find.text('TANTRUM'), findsOneWidget);

    // Verify that the 'Play as Guest' option is visible.
    expect(find.text('Play as Guest'), findsOneWidget);
  });
}
