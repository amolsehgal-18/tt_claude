import 'dart:math';
import 'package:flutter/material.dart';

class StatWheel extends StatelessWidget {
  final double board;
  final double dressingRoom;
  final double fans;
  final double size;

  const StatWheel({
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
      child: Stack(
        alignment: Alignment.center,
        children: [
          CustomPaint(
            size: Size(size, size),
            painter: _WheelPainter(board, dressingRoom, fans),
          ),
          // Labels (optional, maybe icons?)
          // We can position them roughly in the center of sectors if needed
          // For now, let's just stick to the chart visualization to keep it clean
        ],
      ),
    );
  }
}

class _WheelPainter extends CustomPainter {
  final double v1; // Board
  final double v2; // Dressing Room
  final double v3; // Fans

  _WheelPainter(this.v1, this.v2, this.v3);

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final maxRadius = size.width / 2;

    // Draw Background Circle (Faint)
    final bgPaint = Paint()
      ..color = Colors.white10
      ..style = PaintingStyle.fill;
    canvas.drawCircle(center, maxRadius, bgPaint);

    // Draw Slices
    // Top (270 to 30) -> Board (Blue)
    _drawSlice(canvas, center, maxRadius, v1, -90, 120,
        const Color(0xFF00F0FF)); // Electric Blue

    // Right/Bottom (30 to 150) -> Dressing Room (Gold)
    _drawSlice(canvas, center, maxRadius, v2, 30, 120,
        const Color(0xFFFFD700)); // Gold

    // Left/Bottom (150 to 270) -> Fans (Red)
    _drawSlice(canvas, center, maxRadius, v3, 150, 120,
        const Color(0xFFCC0000)); // Deep Red
  }

  void _drawSlice(Canvas canvas, Offset center, double maxRadius, double pct,
      double startAngleDeg, double sweepAngleDeg, Color color) {
    final paint = Paint()
      ..color = color.withValues(alpha: 0.8)
      ..style = PaintingStyle.fill;

    final radius = maxRadius * pct.clamp(0.1, 1.0);
    final rect = Rect.fromCircle(center: center, radius: radius);

    canvas.drawArc(
        rect, _degToRad(startAngleDeg), _degToRad(sweepAngleDeg), true, paint);

    // Border for definition
    final borderPaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;
    canvas.drawArc(rect, _degToRad(startAngleDeg), _degToRad(sweepAngleDeg),
        true, borderPaint);
  }

  double _degToRad(double deg) => deg * (pi / 180.0);

  @override
  bool shouldRepaint(covariant _WheelPainter oldDelegate) {
    return oldDelegate.v1 != v1 || oldDelegate.v2 != v2 || oldDelegate.v3 != v3;
  }
}
