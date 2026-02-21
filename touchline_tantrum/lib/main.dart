import 'package:flutter/material.dart';
// import 'package:firebase_core/firebase_core.dart';  // Commented out for testing
import 'utils/constants.dart';
import 'utils/settings_manager.dart';
import 'utils/audio_manager.dart';
// import 'screens/auth_screen.dart';  // Commented out for testing
import 'screens/setup_screen.dart';
import 'screens/game_screen.dart';
import 'models/active_game_session.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Safe initialization with timeouts
  try {
    await Future.wait([
      SettingsManager.instance.load(),
      AudioManager.instance.initialize(),
    ]).timeout(const Duration(seconds: 3), onTimeout: () {
      debugPrint("Initialization timed out after 3 seconds. Continuing...");
      return [];
    });
  } catch (e) {
    debugPrint("Initialization error: $e");
  }

  runApp(const TouchlineTantrumApp());
}

class TouchlineTantrumApp extends StatelessWidget {
  const TouchlineTantrumApp({super.key});
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: kBlack,
        textSelectionTheme:
            const TextSelectionThemeData(cursorColor: kNeonYellow),
      ),
      home: const SetupScreen(), // Back to SetupScreen for testing
      routes: {
        '/game': (context) {
          final args =
              ModalRoute.of(context)?.settings.arguments as ActiveGameSession?;
          if (args != null) return GameScreen(session: args);

          return const GameLauncher();
        },
      },
    );
  }
}

class GameLauncher extends StatelessWidget {
  const GameLauncher({super.key});

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<SharedPreferences>(
      future: SharedPreferences.getInstance(),
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          return Scaffold(
            body: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, color: Colors.red, size: 60),
                  const SizedBox(height: 20),
                  const Text("FAILED TO LOAD SAVED GAME",
                      style:
                          TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                  const SizedBox(height: 20),
                  ElevatedButton(
                    onPressed: () =>
                        Navigator.of(context).pushReplacementNamed('/'),
                    child: const Text("RETURN TO SETUP"),
                  )
                ],
              ),
            ),
          );
        }
        if (!snapshot.hasData) {
          return const Scaffold(
              body:
                  Center(child: CircularProgressIndicator(color: kNeonYellow)));
        }

        final sessionJson = snapshot.data!.getString('saved_session');
        if (sessionJson == null) return const SetupScreen();

        try {
          final session = ActiveGameSession.fromJson(jsonDecode(sessionJson));
          return GameScreen(session: session);
        } catch (e) {
          return const SetupScreen();
        }
      },
    );
  }
}
