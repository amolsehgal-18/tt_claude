import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:touchline_tantrum/utils/constants.dart';
import 'package:touchline_tantrum/widgets/team_logo.dart';
import 'package:touchline_tantrum/screens/main_menu.dart';

class SetupScreen extends StatefulWidget {
  const SetupScreen({super.key});
  @override
  State<SetupScreen> createState() => _SetupScreenState();
}

class _SetupScreenState extends State<SetupScreen> {
  final TextEditingController _nameController =
      TextEditingController(text: "SAME SHIZZ FC");
  int _logoSeed = 0;
  bool _hasSavedGame = false;
  late PageController _pageController;

  @override
  void initState() {
    super.initState();
    _checkForSavedGame();
    _pageController = PageController(viewportFraction: 0.4, initialPage: _logoSeed);
  }

  @override
  void dispose() {
    _nameController.dispose();
    _pageController.dispose();
    super.dispose();
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
          SizedBox(
            height: 120,
            child: PageView.builder(
              controller: _pageController,
              itemCount: 20, // There are 20 logos
              onPageChanged: (index) {
                setState(() {
                  _logoSeed = index;
                });
              },
              itemBuilder: (context, index) {
                return AnimatedBuilder(
                  animation: _pageController,
                  builder: (context, child) {
                    double value = 1.0;
                    if (_pageController.position.haveDimensions) {
                      value = (_pageController.page! - index).abs();
                      value = (1 - value * 0.4).clamp(0.0, 1.0);
                    }
                    return Center(
                      child: SizedBox(
                        height: Curves.easeOut.transform(value) * 100,
                        width: Curves.easeOut.transform(value) * 100,
                        child: child,
                      ),
                    );
                  },
                  child: TeamLogo(seed: index, size: 100, isLight: true),
                );
              },
            ),
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
