import 'dart:math';
import 'package:flutter/material.dart';

class StatRings extends StatelessWidget {
  final double board, dressingRoom, fans, size;
  const StatRings(
      {super.key,
      required this.board,
      required this.dressingRoom,
      required this.fans,
      this.size = 120});

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
        size: Size(size, size * 0.5),
        painter: _RingPainter(v1: board, v2: dressingRoom, v3: fans));
  }
}

class _RingPainter extends CustomPainter {
  final double v1, v2, v3;
  _RingPainter({required this.v1, required this.v2, required this.v3});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, 0);
    final maxRadius = size.width / 2;
    final strokeWidth = maxRadius * 0.22;
    const gap = 4.0;

    _drawRing(canvas, center, maxRadius - (strokeWidth / 2), strokeWidth, v1,
        const Color(0xFF66C2FF));

    _drawRing(canvas, center, maxRadius - (strokeWidth * 1.5) - gap,
        strokeWidth, v2, const Color(0xFFE5B800));

    _drawRing(canvas, center, maxRadius - (strokeWidth * 2.5) - (gap * 2),
        strokeWidth, v3, const Color(0xFFC24448));
  }

  void _drawRing(Canvas canvas, Offset center, double radius, double stroke,
      double percent, Color color) {
    const startAngle = 0.0;
    const sweepAngle = pi;

    final bgPaint = Paint()
      ..color = Colors.white10
      ..style = PaintingStyle.stroke
      ..strokeWidth = stroke
      ..strokeCap = StrokeCap.butt;

    canvas.drawArc(Rect.fromCircle(center: center, radius: radius), startAngle,
        sweepAngle, false, bgPaint);

    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = stroke
      ..strokeCap = StrokeCap.butt;

    double activeSweepAngle = sweepAngle * percent;
    canvas.drawArc(Rect.fromCircle(center: center, radius: radius), startAngle,
        activeSweepAngle, false, paint);
  }

  @override
  bool shouldRepaint(covariant _RingPainter oldDelegate) {
    return oldDelegate.v1 != v1 || oldDelegate.v2 != v2 || oldDelegate.v3 != v3;
  }
}
