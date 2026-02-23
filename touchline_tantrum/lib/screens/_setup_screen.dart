import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../utils/constants.dart';
import 'main_menu.dart';

class SetupScreen extends StatefulWidget {
  final bool isNewGame;
  const SetupScreen({super.key, this.isNewGame = false});
  @override
  State<SetupScreen> createState() => _SetupScreenState();
}

class _SetupScreenState extends State<SetupScreen> {
  final TextEditingController _nameController =
      TextEditingController(text: "SAME SHIZZ FC");
  bool _hasSavedGame = false;

  @override
  void initState() {
    super.initState();
    _checkForSavedGame();
  }

  Future<void> _checkForSavedGame() async {
    final prefs = await SharedPreferences.getInstance();
    if (!mounted) return;
    if (widget.isNewGame) {
      setState(() {
        _hasSavedGame = false;
      });
    } else {
      setState(() {
        _hasSavedGame = prefs.containsKey('saved_board');
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: widget.isNewGame || !_hasSavedGame
          ? AppBar(
              backgroundColor: Colors.transparent,
              elevation: 0,
              title: const Text('CREATE MANAGER'),
            )
          : null,
      body: Center(
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          if (_hasSavedGame && !widget.isNewGame)
            const Text("TOUCHLINE TANTRUM",
                style: TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.w900,
                    color: kNeonYellow)),
          if (!_hasSavedGame || widget.isNewGame) ...[
            const SizedBox(height: 30),
            SizedBox(
                width: 280,
                child: TextField(
                    controller: _nameController,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                        fontWeight: FontWeight.bold, color: Colors.white))),
          ],
          const SizedBox(height: 40),
          if (_hasSavedGame && !widget.isNewGame) ...[
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                  backgroundColor: kGold,
                  padding: const EdgeInsets.symmetric(
                      horizontal: 40, vertical: 15)),
              onPressed: () async {
                final navigator = Navigator.of(context);
                final prefs = await SharedPreferences.getInstance();
                if (!mounted) return;
                final sessionString = prefs.getString('saved_session');
                if (sessionString != null) {
                  navigator.pushReplacementNamed('/game');
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
            onPressed: () {
              if (_hasSavedGame && !widget.isNewGame) {
                Navigator.push(
                    context,
                    MaterialPageRoute(
                        builder: (c) => const SetupScreen(isNewGame: true)));
              } else {
                Navigator.pushReplacement(
                    context,
                    MaterialPageRoute(
                        builder: (c) => MainMenu(
                              userName: _nameController.text,
                              userLogo: 0,
                            )));
              }
            },
            child: Text(
                _hasSavedGame && !widget.isNewGame
                    ? "NEW CAREER"
                    : (widget.isNewGame ? "CONTINUE" : "START CAREER"),
                style: const TextStyle(
                    color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ]),
      ),
    );
  }
}
