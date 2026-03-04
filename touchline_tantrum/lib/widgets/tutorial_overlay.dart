import 'package:flutter/material.dart';
import '../utils/constants.dart';

class TutorialOverlay extends StatefulWidget {
  final VoidCallback onComplete;
  const TutorialOverlay({super.key, required this.onComplete});

  @override
  State<TutorialOverlay> createState() => _TutorialOverlayState();
}

class _TutorialOverlayState extends State<TutorialOverlay> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  final List<TutorialPage> _pages = [
    TutorialPage(
      title: "WELCOME TO\nTOUCHLINE TANTRUM",
      description:
          "You're the manager. Every decision shapes your fate.\n\nSwipe left or right to make choices that will define your career.",
      icon: Icons.sports_soccer,
    ),
    TutorialPage(
      title: "THE 3 PILLARS",
      description:
          "Balance three critical relationships:\n\n• BOARD SUPPORT - Keep the owners happy\n• SQUAD MORALE - Maintain dressing room harmony\n• FAN SUPPORT - Win over the supporters\n\nLet any drop to zero, and you're SACKED.",
      icon: Icons.bar_chart,
    ),
    TutorialPage(
      title: "EVERY DECISION\nMATTERS",
      description:
          "Each swipe impacts all three pillars.\n\nChoose wisely - what pleases the board might anger the squad.\n\nFind the balance or face the consequences.",
      icon: Icons.swap_horiz,
    ),
    TutorialPage(
      title: "MATCH DAY\nPRESSURE",
      description:
          "After 3 decisions, it's MATCH DAY.\n\nYour choices affect win probability.\n\nHigh morale = Better results\nLow morale = Disaster awaits",
      icon: Icons.stadium,
    ),
    TutorialPage(
      title: "SURVIVE OR\nGET SACKED",
      description:
          "Complete your objective:\n• Win the league\n• Secure top 4\n• Avoid relegation\n\nFail, and you'll be shown the door.\n\nReady to prove yourself?",
      icon: Icons.emoji_events,
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.black.withAlpha(242),
      child: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: PageView.builder(
                controller: _pageController,
                onPageChanged: (index) => setState(() => _currentPage = index),
                itemCount: _pages.length,
                itemBuilder: (context, index) {
                  final page = _pages[index];
                  return Padding(
                    padding: const EdgeInsets.all(40),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(page.icon, size: 80, color: kNeonYellow),
                        const SizedBox(height: 40),
                        Text(
                          page.title,
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            fontSize: 28,
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                            height: 1.2,
                          ),
                        ),
                        const SizedBox(height: 30),
                        Text(
                          page.description,
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            fontSize: 16,
                            color: Colors.white70,
                            height: 1.6,
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
            // Page indicators
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(
                _pages.length,
                (index) => Container(
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  width: _currentPage == index ? 24 : 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: _currentPage == index ? kNeonYellow : Colors.white24,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 30),
            // Navigation buttons
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 40),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  if (_currentPage > 0)
                    TextButton(
                      onPressed: () {
                        _pageController.previousPage(
                          duration: const Duration(milliseconds: 300),
                          curve: Curves.easeInOut,
                        );
                      },
                      child: const Text(
                        "BACK",
                        style: TextStyle(
                          color: Colors.white54,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    )
                  else
                    const SizedBox(width: 80),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: kNeonYellow,
                      padding: const EdgeInsets.symmetric(
                          horizontal: 30, vertical: 15),
                    ),
                    onPressed: () {
                      if (_currentPage < _pages.length - 1) {
                        _pageController.nextPage(
                          duration: const Duration(milliseconds: 300),
                          curve: Curves.easeInOut,
                        );
                      } else {
                        widget.onComplete();
                      }
                    },
                    child: Text(
                      _currentPage < _pages.length - 1 ? "NEXT" : "LET'S GO",
                      style: const TextStyle(
                        color: Colors.black,
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }
}

class TutorialPage {
  final String title;
  final String description;
  final IconData icon;

  TutorialPage({
    required this.title,
    required this.description,
    required this.icon,
  });
}
