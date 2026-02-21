import 'package:flutter/material.dart';
import 'dart:math';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../utils/constants.dart';
import '../widgets/team_logo.dart';
import 'main_menu.dart';

class SetupScreen extends StatefulWidget {
  const SetupScreen({super.key});
  @override
  State<SetupScreen> createState() => _SetupScreenState();
}

class _SetupScreenState extends State<SetupScreen> {
  final TextEditingController _nameController =
      TextEditingController(text: "SAME SHIZZ FC");
  int _logoSeed = Random().nextInt(1000);
  bool _hasSavedGame = false;

  @override
  void initState() {
    super.initState();
    _checkForSavedGame();
  }

  Future<void> _checkForSavedGame() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _hasSavedGame = prefs.containsKey('saved_board');
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          const Text("TOUCHLINE TANTRUM",
              style: TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.w900,
                  color: kNeonYellow)),
          const SizedBox(height: 40),
          GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: () {
              setState(() => _logoSeed = Random().nextInt(1000));
              HapticFeedback.selectionClick();
            },
            child: Column(children: [
              Container(
                  padding: const EdgeInsets.all(20),
                  decoration: const BoxDecoration(
                      shape: BoxShape.circle, color: Colors.white10),
                  child: TeamLogo(seed: _logoSeed, size: 80, isLight: true)),
              const SizedBox(height: 10),
              const Text("TAP TO CHANGE LOGO",
                  style: TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.bold))
            ]),
          ),
          const SizedBox(height: 30),
          SizedBox(
              width: 280,
              child: TextField(
                  controller: _nameController,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                      fontWeight: FontWeight.bold, color: Colors.white))),
          const SizedBox(height: 40),
          if (_hasSavedGame) ...[
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                  backgroundColor: kGold,
                  padding:
                      const EdgeInsets.symmetric(horizontal: 40, vertical: 15)),
              onPressed: () async {
                final prefs = await SharedPreferences.getInstance();
                final sessionString = prefs.getString('saved_session');
                if (sessionString != null) {
                  // Navigate directly to GameScreen to resume
                  if (!context.mounted) return;
                  Navigator.pushReplacementNamed(context, '/game');
                }
              },
              child: const Text("RESUME CAREER",
                  style: TextStyle(
                      color: Colors.black, fontWeight: FontWeight.bold)),
            ),
            const SizedBox(height: 15),
          ],
          ElevatedButton(
            style: ElevatedButton.styleFrom(
                backgroundColor: kSlateBlue,
                padding:
                    const EdgeInsets.symmetric(horizontal: 40, vertical: 15)),
            onPressed: () => Navigator.pushReplacement(
                context,
                MaterialPageRoute(
                    builder: (c) => MainMenu(
                        userName: _nameController.text, userLogo: _logoSeed))),
            child: Text(_hasSavedGame ? "NEW CAREER" : "START CAREER",
                style: const TextStyle(
                    color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ]),
      ),
    );
  }
}
