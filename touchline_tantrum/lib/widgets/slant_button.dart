import 'package:flutter/material.dart';

class SlantButton extends StatelessWidget {
  final String text;
  final Color color;
  final bool isLeft;
  final VoidCallback onTap;
  const SlantButton(
      {super.key,
      required this.text,
      required this.color,
      required this.isLeft,
      required this.onTap});
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
        onTap: onTap,
        child: ClipPath(
            clipper: TriangleClipper(isLeft: isLeft),
            child: Container(
                width: MediaQuery.of(context).size.width * 0.46,
                height: 100,
                color: color,
                alignment: Alignment.center,
                child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 10),
                    child: Text(text.toUpperCase(),
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                            fontWeight: FontWeight.bold, fontSize: 14))))));
  }
}

class TriangleClipper extends CustomClipper<Path> {
  final bool isLeft;
  TriangleClipper({required this.isLeft});
  @override
  Path getClip(Size size) {
    Path p = Path();
    if (isLeft) {
      p.lineTo(size.width, 0);
      p.lineTo(size.width * 0.85, size.height);
      p.lineTo(0, size.height);
    } else {
      p.moveTo(size.width * 0.15, 0);
      p.lineTo(size.width, 0);
      p.lineTo(size.width, size.height);
      p.lineTo(0, size.height);
    }
    p.close();
    return p;
  }

  @override
  bool shouldReclip(CustomClipper<Path> oldClipper) => false;
}
