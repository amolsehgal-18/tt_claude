import 'package:flutter/material.dart';

class ArcadeStatBar extends StatelessWidget {
  final String label;
  final double value;
  final Color color;
  final bool isVertical;

  const ArcadeStatBar(
      {super.key,
      required this.label,
      required this.value,
      required this.color,
      this.isVertical = false});

  @override
  Widget build(BuildContext context) {
    if (isVertical) {
      return Column(children: [
        Text("${(value * 100).toInt()}%",
            style: const TextStyle(
                fontSize: 14, // Bigger font
                fontWeight: FontWeight.bold,
                color: Colors.white)),
        const SizedBox(height: 5),
        Container(
          width: 50, // Loosely doubled from original 14->30->50+
          height: 100, // Reduced from 120 -> 100 to save space
          decoration: BoxDecoration(
              color: Colors.white10, borderRadius: BorderRadius.circular(8)),
          alignment: Alignment.bottomCenter,
          child: FractionallySizedBox(
            heightFactor: value.clamp(0.01, 1.0),
            widthFactor: 1.0,
            child: Container(
                decoration: BoxDecoration(
                    color: color, borderRadius: BorderRadius.circular(8))),
          ),
        ),
      ]);
    }

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Text(label,
            style: TextStyle(
                color: color, fontSize: 11, fontWeight: FontWeight.w900)),
        Text("${(value * 100).toInt()}%",
            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w900))
      ]),
      const SizedBox(height: 5),
      SizedBox(
          height: 12,
          child: Stack(children: [
            Container(
                decoration: BoxDecoration(
                    color: Colors.white10,
                    borderRadius: BorderRadius.circular(5))),
            FractionallySizedBox(
                widthFactor: value.clamp(0.01, 1.0),
                child: Container(
                    decoration: BoxDecoration(
                        color: color, borderRadius: BorderRadius.circular(5))))
          ]))
    ]);
  }
}
