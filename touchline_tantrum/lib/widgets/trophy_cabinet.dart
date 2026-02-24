import 'package:flutter/material.dart';
import '../utils/constants.dart';

class TrophyCabinet extends StatelessWidget {
  final Map<String, int> winsBySaga;

  const TrophyCabinet({
    super.key,
    required this.winsBySaga,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: Colors.black.withAlpha(128),
        borderRadius: BorderRadius.circular(15),
        border: Border.all(color: Colors.grey[800]!, width: 4),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(179),
            blurRadius: 20,
            spreadRadius: 5,
          ),
        ],
      ),
      child: Column(
        children: [
          _buildShelf("DON'T BOTTLE IT", winsBySaga['bottle'] ?? 0, kNeonYellow),
          _buildShelf("TOP 4 IS LAVA", winsBySaga['top4'] ?? 0, kElectricBlue),
          _buildShelf("THE GREAT ESCAPE", winsBySaga['escape'] ?? 0, kDeepRed),
        ],
      ),
    );
  }

  Widget _buildShelf(String sagaName, int trophyCount, Color themeColor) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 10, vertical: 15),
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(color: themeColor.withAlpha(128), width: 2),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            sagaName,
            style: TextStyle(
              color: themeColor,
              fontSize: 18,
              fontWeight: FontWeight.bold,
              letterSpacing: 1.5,
            ),
          ),
          const SizedBox(height: 15),
          Container( // This is the shelf wood
            height: 12,
            decoration: BoxDecoration(
              color: Colors.brown[900],
              borderRadius: BorderRadius.circular(5),
               boxShadow: [
                BoxShadow(
                  color: Colors.black.withAlpha(153),
                  offset: const Offset(0, 6),
                  blurRadius: 6,
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),
          SizedBox(
            height: 50,
            child: trophyCount == 0
                ? const Center(
                    child: Text(
                      'EMPTY SHELF',
                      style: TextStyle(
                        color: Colors.white54,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                  )
                : ListView.builder(
                    scrollDirection: Axis.horizontal,
                    itemCount: trophyCount,
                    itemBuilder: (context, index) => const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 4.0),
                      child: Icon(
                        Icons.emoji_events,
                        color: kGold,
                        size: 45,
                      ),
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}
