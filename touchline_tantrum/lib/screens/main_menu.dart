import 'package:flutter/material.dart';
import '../utils/constants.dart';
import '../models/active_game_session.dart';
import '../widgets/settings_dialog.dart';
import '../widgets/tutorial_overlay.dart';
import 'game_screen.dart';
import 'trophy_cabinet_screen.dart';

class MainMenu extends StatefulWidget {
  final String userName;
  final int userLogo;
  const MainMenu({super.key, required this.userName, required this.userLogo});
  @override
  State<MainMenu> createState() => _MainMenuState();
}

class _MainMenuState extends State<MainMenu> {
  String? expandedId;
  bool _showTutorial = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          Center(
            child:
                Column(mainAxisAlignment: MainAxisAlignment.center, children: [
              const Text("CHOOSE YOUR SAGA",
                  style: TextStyle(
                      fontSize: 26,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 4,
                      color: Colors.white)),
              const SizedBox(height: 30),
              _modeItem("DON'T BOTTLE IT", "1st OR SACKED", kNeonYellow,
                  "bottle", [6, 8, 10]),
              _modeItem("TOP 4 IS LAVA", "FINISH TOP 4 OR SACKED",
                  kElectricBlue, "top4", [6, 8, 10]),
              _modeItem("THE GREAT ESCAPE", "STAY UP OR SACKED", kDeepRed,
                  "escape", [6, 8, 10]),
              _modeItem("FULL CAREER", "STAY EMPLOYED", Colors.white, "career",
                  [19, 38]),
            ]),
          ),
          Positioned(
            top: 50,
            left: 20,
            child: IconButton(
              icon: const Icon(Icons.help_outline,
                  color: Colors.white, size: 30),
              onPressed: () {
                setState(() => _showTutorial = true);
              },
            ),
          ),
          Positioned(
            top: 50,
            right: 20,
            child: Column(
              children: [
                IconButton(
                  icon: const Icon(Icons.emoji_events, color: Colors.white, size: 30),
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => const TrophyCabinetScreen()),
                    );
                  },
                ),
                const SizedBox(height: 10),
                IconButton(
                  icon:
                      const Icon(Icons.settings, color: Colors.white, size: 30),
                  onPressed: () {
                    showDialog(
                      context: context,
                      builder: (context) => const SettingsDialog(),
                    );
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

  Widget _modeItem(
      String t, String obj, Color theme, String id, List<int> durs) {
    bool exp = expandedId == id;
    return GestureDetector(
      onTap: () => setState(() => expandedId = exp ? null : id),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        width: 340,
        margin: const EdgeInsets.symmetric(vertical: 10),
        padding: const EdgeInsets.all(15),
        decoration: BoxDecoration(
            color: exp ? Colors.black : Colors.white.withAlpha(12),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: exp ? theme : Colors.white10)),
        child: Column(children: [
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Text(t,
                style: TextStyle(
                    color: theme, fontWeight: FontWeight.w900, fontSize: 18)),
            Icon(exp ? Icons.arrow_drop_up : Icons.arrow_drop_down,
                color: theme)
          ]),
          if (exp) ...[
            const SizedBox(height: 10),
            Text(obj,
                style: const TextStyle(
                    fontSize: 12,
                    color: Colors.white70,
                    fontWeight: FontWeight.bold)),
            const SizedBox(height: 15),
            Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: durs
                    .map((m) => OutlinedButton(
                          onPressed: () => Navigator.push(
                              context,
                              MaterialPageRoute(
                                  builder: (c) => GameScreen(
                                      session: ActiveGameSession(
                                          id: id,
                                          userName: widget.userName,
                                          objective: obj,
                                          totalMatches: m,
                                          userLogo: widget.userLogo,
                                          startWeek: (38 - m))))),
                          child: Text("$m GM",
                              style: const TextStyle(color: Colors.white)),
                        ))
                    .toList())
          ]
        ]),
      ),
    );
  }
}
