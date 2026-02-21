import 'package:flutter/material.dart';
import '../utils/constants.dart';

class TeamLogo extends StatelessWidget {
  final int seed;
  final double size;
  final bool isLight;

  const TeamLogo(
      {super.key, required this.seed, this.size = 50, required this.isLight});

  @override
  Widget build(BuildContext context) {
    final List<IconData> icons = [
      Icons.shield,
      Icons.security,
      Icons.local_police,
      Icons.verified_user,
      Icons.admin_panel_settings,
      Icons.gpp_good,
    ];
    final List<Color> colors = [
      kElectricBlue,
      kDeepRed,
      kNeonYellow,
      Colors.purpleAccent,
      Colors.orangeAccent,
      Colors.tealAccent
    ];

    // deterministic visual based on seed
    final icon = icons[seed % icons.length];
    final color = colors[(seed ~/ 10) % colors.length];

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: isLight ? Colors.white10 : Colors.black12,
        border: Border.all(color: isLight ? color : Colors.white24, width: 2),
      ),
      child: Icon(icon, color: isLight ? color : kBlack, size: size * 0.6),
    );
  }
}
