import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:touchline_tantrum/screens/auth_screen.dart';
import './mock_firebase.dart';

void main() {
  // Stub Firebase Auth platform before any tests run
  setupFirebaseAuthMocks();

  testWidgets('AuthScreen shows title and sign-in options', (WidgetTester tester) async {
    await tester.pumpWidget(const MaterialApp(
      home: AuthScreen(),
    ));
    await tester.pumpAndSettle();

    expect(find.text('TOUCHLINE'), findsOneWidget);
    expect(find.text('TANTRUM'), findsOneWidget);
    expect(find.text('Play as Guest'), findsOneWidget);
    expect(find.text('Continue with Google'), findsOneWidget);
  });
}
