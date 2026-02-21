import 'package:flutter/material.dart';

class ManagerMood extends StatelessWidget {
  final double boardTrust;
  final double fanSupport;
  final double dressingRoom;

  final double size;

  const ManagerMood({
    super.key,
    required this.boardTrust,
    required this.fanSupport,
    required this.dressingRoom,
    this.size = 80,
  });

  String _getMoodImage() {
    // Calculate average mood from all stats
    double avgMood = (boardTrust + fanSupport + dressingRoom) / 3;

    if (avgMood >= 0.7) return 'assets/images/manager/man_happy.png';
    if (avgMood >= 0.5) return 'assets/images/manager/man_neutral.png';
    if (avgMood >= 0.3) return 'assets/images/manager/man_stressed.png';
    return 'assets/images/manager/man_angry.png';
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(color: Colors.white24, width: 2),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.5),
            blurRadius: 10,
            spreadRadius: 2,
          ),
        ],
      ),
      child: ClipOval(
        child: Image.asset(
          _getMoodImage(),
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) {
            // Fallback if image fails to load
            return Container(
              color: Colors.grey.shade800,
              child: const Icon(Icons.person, color: Colors.white, size: 40),
            );
          },
        ),
      ),
    );
  }
}
