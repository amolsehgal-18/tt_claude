import 'package:flutter/material.dart';

class SagaButton extends StatefulWidget {
  final String title;
  final Color color;
  final VoidCallback? on6GameTap;
  final VoidCallback? on8GameTap;
  final VoidCallback? on10GameTap;

  const SagaButton({
    super.key,
    required this.title,
    required this.color,
    this.on6GameTap,
    this.on8GameTap,
    this.on10GameTap,
  });

  @override
  State<SagaButton> createState() => _SagaButtonState();
}

class _SagaButtonState extends State<SagaButton> {
  bool _isExpanded = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        setState(() {
          _isExpanded = !_isExpanded;
        });
      },
      child: Container(
        width: 300,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.grey[850],
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  widget.title,
                  style: TextStyle(
                    color: widget.color,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Icon(
                  _isExpanded ? Icons.arrow_drop_up : Icons.arrow_drop_down,
                  color: widget.color,
                ),
              ],
            ),
            if (_isExpanded)
              Padding(
                padding: const EdgeInsets.only(top: 20),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    ElevatedButton(
                      onPressed: widget.on6GameTap,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.transparent,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(20),
                          side: const BorderSide(color: Colors.white, width: 1),
                        ),
                      ),
                      child: const Text('6 GM', style: TextStyle(color: Colors.white)),
                    ),
                    ElevatedButton(
                      onPressed: widget.on8GameTap,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.transparent,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(20),
                          side: const BorderSide(color: Colors.white, width: 1),
                        ),
                      ),
                      child: const Text('8 GM', style: TextStyle(color: Colors.white)),
                    ),
                    ElevatedButton(
                      onPressed: widget.on10GameTap,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.transparent,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(20),
                          side: const BorderSide(color: Colors.white, width: 1),
                        ),
                      ),
                      child: const Text('10 GM', style: TextStyle(color: Colors.white)),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}
