import 'package:flutter/material.dart';

// Enum to represent manager's state, now defined in game_screen.dart
enum ManagerState { neutral, happy, stressed, angry, sacked }

class ManagerMood extends StatelessWidget {
  final ManagerState mood;
  final double size;

  const ManagerMood({
    super.key,
    required this.mood,
    this.size = 80,
  });

  String _getMoodImage() {
    switch (mood) {
      case ManagerState.happy:
        return 'assets/images/manager/man_happy.png';
      case ManagerState.neutral:
        return 'assets/images/manager/man_neutral.png';
      case ManagerState.stressed:
        return 'assets/images/manager/man_stressed.png';
      case ManagerState.angry:
        return 'assets/images/manager/man_angry.png';
      case ManagerState.sacked:
        return 'assets/images/manager/man_sacked.png';
    }
  }

  String _getMoodLabel() {
    return mood.name.toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white24, width: 2),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withAlpha(128),
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
        ),
        const SizedBox(height: 8),
        Text(
          _getMoodLabel(),
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: 12,
          ),
        ),
      ],
    );
  }
}
