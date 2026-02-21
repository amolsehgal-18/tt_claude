import 'package:flutter/material.dart';
import '../utils/constants.dart';

class TrophyCabinet extends StatelessWidget {
  const TrophyCabinet({super.key});

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.transparent,
      child: Container(
        width: MediaQuery.of(context).size.width * 0.9,
        height: MediaQuery.of(context).size.height * 0.8,
        decoration: BoxDecoration(
          color: const Color(0xFF2C1810), // Dark wood color
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFF8B4513), width: 3),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.5),
              blurRadius: 20,
              spreadRadius: 5,
            ),
          ],
        ),
        child: Column(
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(20),
              decoration: const BoxDecoration(
                color: Color(0xFF1A0F08),
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(17),
                  topRight: Radius.circular(17),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    "🏆 TROPHY CABINET",
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w900,
                      color: kNeonYellow,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            ),

            // Progress
            const Padding(
              padding: EdgeInsets.all(20),
              child: Column(
                children: [
                  Text(
                    "0/25 Achievements (0%)",
                    style: TextStyle(
                      fontSize: 16,
                      color: Colors.white70,
                    ),
                  ),
                  SizedBox(height: 10),
                  LinearProgressIndicator(
                    value: 0.0,
                    backgroundColor: Colors.white24,
                    valueColor: AlwaysStoppedAnimation<Color>(kNeonYellow),
                  ),
                ],
              ),
            ),

            // Shelves
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    _buildShelf(
                        "LEGENDARY", [false, false, false, false, false]),
                    _buildShelf("GOLD", [false, false, false, false, false]),
                    _buildShelf("SILVER", [false, false, false, false, false]),
                    _buildShelf("BRONZE", [false, false, false, false, false]),
                  ],
                ),
              ),
            ),

            // Footer
            Container(
              padding: const EdgeInsets.all(20),
              child: const Text(
                "Complete sagas and challenges to unlock trophies!",
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.white38,
                  fontStyle: FontStyle.italic,
                ),
                textAlign: TextAlign.center,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildShelf(String tier, List<bool> trophies) {
    Color tierColor;
    switch (tier) {
      case "LEGENDARY":
        tierColor = const Color(0xFFFF00FF); // Magenta
        break;
      case "GOLD":
        tierColor = const Color(0xFFFFD700);
        break;
      case "SILVER":
        tierColor = const Color(0xFFC0C0C0);
        break;
      case "BRONZE":
        tierColor = const Color(0xFFCD7F32);
        break;
      default:
        tierColor = Colors.white;
    }

    return Container(
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.3),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: tierColor.withValues(alpha: 0.3), width: 1),
      ),
      child: Column(
        children: [
          Text(
            tier,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: tierColor,
            ),
          ),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: trophies.map((unlocked) {
              return Container(
                width: 50,
                height: 50,
                decoration: BoxDecoration(
                  color: unlocked
                      ? tierColor.withValues(alpha: 0.2)
                      : Colors.white.withValues(alpha: 0.05),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: unlocked ? tierColor : Colors.white24,
                    width: 2,
                  ),
                ),
                child: Center(
                  child: Icon(
                    unlocked ? Icons.emoji_events : Icons.lock_outline,
                    color: unlocked ? tierColor : Colors.white24,
                    size: 30,
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
}
