import 'dart:math';
import 'package:flutter/material.dart';
import 'package:touchline_tantrum/utils/constants.dart';

class TeamLogo extends StatelessWidget {
  final int seed;
  final double size;
  final bool isLight;

  const TeamLogo(
      {super.key, required this.seed, this.size = 100, this.isLight = false});

  @override
  Widget build(BuildContext context) {
    final rnd = Random(seed);

    const iconOptions = [
      Icons.shield,
      Icons.bolt,
      Icons.whatshot,
      Icons.ac_unit,
      Icons.anchor,
      Icons.bug_report,
      Icons.all_out,
      Icons.rocket_launch,
      Icons.public,
      Icons.military_tech,
      Icons.pets,
      Icons.star,
      Icons.sports_soccer,
    ];

    final List<List<Color>> palettes = [
      [kNeonYellow, kElectricBlue],
      [kDeepRed, Colors.white],
      [kElectricBlue, kNeonYellow],
      [kGold, kSlateBlue],
      [kSilver, kPitchDark],
      [Colors.green, Colors.white],
      [Colors.purple, kNeonYellow],
      [Colors.orange, kPitchDark],
    ];

    final icon = iconOptions[rnd.nextInt(iconOptions.length)];
    final palette = palettes[rnd.nextInt(palettes.length)];
    final primaryColor = palette[0];
    final accentColor = palette[1];
    final shape = rnd.nextBool() ? BoxShape.circle : BoxShape.rectangle;

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: shape,
        borderRadius:
            shape == BoxShape.rectangle ? BorderRadius.circular(size * 0.2) : null,
        color: isLight ? primaryColor.withAlpha(40) : primaryColor,
        border: Border.all(
            color: isLight ? primaryColor : accentColor, width: size * 0.05),
      ),
      child: Icon(icon,
          color: isLight ? primaryColor : accentColor, size: size * 0.6),
    );
  }
}
