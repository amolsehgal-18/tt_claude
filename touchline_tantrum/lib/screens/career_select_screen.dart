import 'package:flutter/material.dart';
import 'package:touchline_tantrum/utils/trophy_manager.dart';
import '../utils/constants.dart';
import '../widgets/settings_dialog.dart';
import '../widgets/tutorial_overlay.dart';
import '../widgets/trophy_cabinet.dart';
import 'setup_screen.dart';

class CareerSelectScreen extends StatefulWidget {
  const CareerSelectScreen({super.key});

  @override
  State<CareerSelectScreen> createState() => _CareerSelectScreenState();
}

class _CareerSelectScreenState extends State<CareerSelectScreen> {
  bool _showTutorial = false;
  final TrophyManager _trophyManager = TrophyManager();
  Map<String, int> _winsBySaga = {};

  @override
  void initState() {
    super.initState();
    _loadWins();
  }

  Future<void> _loadWins() async {
    final wins = await _trophyManager.getWins();
    final Map<String, int> winsBySaga = {
      'bottle': 0,
      'top4': 0,
      'escape': 0,
    };

    for (String win in wins) {
      if (winsBySaga.containsKey(win)) {
        winsBySaga[win] = winsBySaga[win]! + 1;
      }
    }

    setState(() {
      _winsBySaga = winsBySaga;
    });
  }

  // Mock user data for testing (no Firebase)
  String get _mockUserName => "Test Manager";
  String get _mockUserEmail => "test@touchlinetantrum.com";

  void _createNewCareer() {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => const SetupScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          SafeArea(
            child: Column(
              children: [
                // Header with user info
                Padding(
                  padding: const EdgeInsets.all(20),
                  child: Row(
                    children: [
                      const CircleAvatar(
                        backgroundColor: kNeonYellow,
                        radius: 20,
                        child: Icon(Icons.person, color: Colors.black),
                      ),
                      const SizedBox(width: 15),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _mockUserName,
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                            Text(
                              _mockUserEmail,
                              style: const TextStyle(
                                fontSize: 12,
                                color: Colors.white54,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                const Text(
                  "YOUR CAREERS",
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 3,
                    color: kNeonYellow,
                  ),
                ),
                const SizedBox(height: 20),

                // Empty state (no careers yet)
                const Expanded(
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.sports_soccer,
                          size: 80,
                          color: Colors.white24,
                        ),
                        SizedBox(height: 20),
                        Text(
                          "No careers yet",
                          style: TextStyle(
                            fontSize: 18,
                            color: Colors.white54,
                          ),
                        ),
                        SizedBox(height: 10),
                        Text(
                          "Create your first career to begin!",
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.white38,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                // Create new career button
                Padding(
                  padding: const EdgeInsets.all(20),
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: kNeonYellow,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 40,
                        vertical: 15,
                      ),
                      minimumSize: const Size(double.infinity, 50),
                    ),
                    onPressed: _createNewCareer,
                    child: const Text(
                      "CREATE NEW CAREER",
                      style: TextStyle(
                        color: Colors.black,
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Top-right buttons
          Positioned(
            top: 50,
            right: 20,
            child: Column(
              children: [
                IconButton(
                  icon: const Icon(Icons.emoji_events,
                      color: kNeonYellow, size: 30),
                  onPressed: () {
                    showDialog(
                      context: context,
                      builder: (context) => TrophyCabinet(winsBySaga: _winsBySaga),
                    );
                  },
                ),
                const SizedBox(height: 10),
                IconButton(
                  icon:
                      const Icon(Icons.settings, color: kNeonYellow, size: 30),
                  onPressed: () {
                    showDialog(
                      context: context,
                      builder: (context) => const SettingsDialog(),
                    );
                  },
                ),
                const SizedBox(height: 10),
                IconButton(
                  icon: const Icon(Icons.help_outline,
                      color: kNeonYellow, size: 30),
                  onPressed: () {
                    setState(() => _showTutorial = true);
                  },
                ),
              ],
            ),
          ),

          if (_showTutorial)
            TutorialOverlay(onComplete: () {
              setState(() => _showTutorial = false);
            }),
        ],
      ),
    );
  }
}
