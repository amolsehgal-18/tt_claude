import 'dart:math';
import 'package:flutter/material.dart';

class StatRings extends StatelessWidget {
  final double board;
  final double dressingRoom;
  final double fans;
  final double size;

  const StatRings({
    super.key,
    required this.board,
    required this.dressingRoom,
    required this.fans,
    this.size = 140,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(
        painter: _RingPainter(board, dressingRoom, fans),
      ),
    );
  }
}

class _RingPainter extends CustomPainter {
  final double v1; // Board (Outer)
  final double v2; // Squad (Middle)
  final double v3; // Fans (Inner)

  _RingPainter(this.v1, this.v2, this.v3);

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final maxRadius = size.width / 2;
    final strokeWidth = maxRadius * 0.22; // Thickness of rings
    const gap = 4.0; // Gap between rings

    // 1. Board (Outer)
    _drawRing(canvas, center, maxRadius - (strokeWidth / 2), strokeWidth, v1,
        const Color(0xFF00F0FF)); // Electric Blue

    // 2. Squad (Middle)
    _drawRing(canvas, center, maxRadius - (strokeWidth * 1.5) - gap,
        strokeWidth, v2, const Color(0xFFFFD700)); // Gold

    // 3. Fans (Inner)
    _drawRing(canvas, center, maxRadius - (strokeWidth * 2.5) - (gap * 2),
        strokeWidth, v3, const Color(0xFFCC0000)); // Deep Red
  }

  void _drawRing(Canvas canvas, Offset center, double radius, double stroke,
      double percent, Color color) {
    // Background Track
    final bgPaint = Paint()
      ..color = Colors.white10
      ..style = PaintingStyle.stroke
      ..strokeWidth = stroke
      ..strokeCap = StrokeCap.round;

    canvas.drawCircle(center, radius, bgPaint);

    // Active Arc
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = stroke
      ..strokeCap = StrokeCap.round;

    // Start at -90 degrees (top)
    double sweepAngle = 2 * pi * percent;
    canvas.drawArc(Rect.fromCircle(center: center, radius: radius), -pi / 2,
        sweepAngle, false, paint);
  }

  @override
  bool shouldRepaint(covariant _RingPainter oldDelegate) {
    return oldDelegate.v1 != v1 || oldDelegate.v2 != v2 || oldDelegate.v3 != v3;
  }
}
