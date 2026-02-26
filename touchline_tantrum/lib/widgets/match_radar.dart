import 'package:flutter/material.dart';

import 'dart:math';
import '../utils/constants.dart';

class MatchRadar extends StatefulWidget {
  const MatchRadar({super.key});

  @override
  State<MatchRadar> createState() => _MatchRadarState();
}

class _MatchRadarState extends State<MatchRadar>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  final List<Offset> _players = [];
  Offset _ball = const Offset(0.5, 0.5);
  Offset _ballTarget = const Offset(0.5, 0.5);
  final Random _rnd = Random();

  @override
  void initState() {
    super.initState();
    _controller =
        AnimationController(vsync: this, duration: const Duration(seconds: 2))
          ..addListener(() {
            if (_rnd.nextDouble() < 0.05) {
              _ballTarget = _players[_rnd.nextInt(_players.length)];
            }
            double lerp = 0.1;
            _ball = Offset(_ball.dx + (_ballTarget.dx - _ball.dx) * lerp,
                _ball.dy + (_ballTarget.dy - _ball.dy) * lerp);
          })
          ..repeat();
    // Generate random player positions
    for (int i = 0; i < 10; i++) {
      _players.add(
          Offset(0.1 + _rnd.nextDouble() * 0.8, 0.1 + _rnd.nextDouble() * 0.8));
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        const Text("SIMULATING...",
            style: TextStyle(
                color: kNeonYellow,
                fontWeight: FontWeight.w900,
                letterSpacing: 4,
                shadows: [Shadow(blurRadius: 10, color: kBlack)])),
        const SizedBox(height: 10),
        Container(
            width: MediaQuery.of(context).size.width * 0.95,
            height: 240,
            decoration: BoxDecoration(
                color: kPitchDark,
                borderRadius: BorderRadius.circular(4),
                border: Border.all(color: Colors.white10, width: 1)),
            child: Stack(
              children: [
                // Tactical Board Drawing & Players
                AnimatedBuilder(
                    animation: _controller,
                    builder: (context, child) {
                      return Stack(children: [
                        Positioned.fill(
                            child: CustomPaint(
                                painter: TacticalBoardPainter(ball: _ball))),
                        ..._players.map((p) {
                          // Simple jitter movement
                          double dx =
                              (sin(_controller.value * 2 * pi + p.dx * 10) *
                                  0.05);
                          double dy =
                              (cos(_controller.value * 2 * pi + p.dy * 10) *
                                  0.05);
                          // Determine color: first 5 are red, last 5 are blue
                          final int index = _players.indexOf(p);
                          final Color dotColor =
                              index < 5 ? Colors.red : Colors.blue;

                          return Positioned(
                            left: (p.dx + dx) *
                                MediaQuery.of(context).size.width *
                                0.95,
                            top: (p.dy + dy) * 240,
                            child: Container(
                              width: 8,
                              height: 8,
                              decoration: BoxDecoration(
                                  color: dotColor, shape: BoxShape.circle),
                            ),
                          );
                        })
                      ]);
                    })
              ],
            ))
      ],
    );
  }
}

class TacticalBoardPainter extends CustomPainter {
  final Offset ball;
  TacticalBoardPainter({this.ball = const Offset(0.5, 0.5)});

  @override
  void paint(Canvas canvas, Size size) {
    final Paint paint = Paint()
      ..color = Colors.white10
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;

    // Pitch Outline
    canvas.drawRect(
        Rect.fromLTWH(10, 10, size.width - 20, size.height - 20), paint);

    // Halfway Line
    canvas.drawLine(Offset(size.width / 2, 10),
        Offset(size.width / 2, size.height - 10), paint);

    // Center Circle
    canvas.drawCircle(Offset(size.width / 2, size.height / 2), 30, paint);

    // Boxes
    canvas.drawRect(
        Rect.fromLTWH(10, size.height / 2 - 40, 60, 80), paint); // Left Box
    canvas.drawRect(
        Rect.fromLTWH(size.width - 70, size.height / 2 - 40, 60, 80),
        paint); // Right Box

    // Draw Ball
    final Paint ballPaint = Paint()..color = kNeonYellow;
    canvas.drawCircle(
        Offset(ball.dx * size.width, ball.dy * size.height), 6, ballPaint);
  }

  @override
  bool shouldRepaint(covariant TacticalBoardPainter oldDelegate) => true;
}
