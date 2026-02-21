import 'package:flutter/material.dart';
import 'dart:async';
import '../utils/constants.dart';

class BreakingNewsTicker extends StatefulWidget {
  final String teamName;
  const BreakingNewsTicker({super.key, required this.teamName});
  @override
  State<BreakingNewsTicker> createState() => _BreakingNewsTickerState();
}

class _BreakingNewsTickerState extends State<BreakingNewsTicker> {
  late ScrollController _scrollController;
  Timer? _timer;
  @override
  void initState() {
    super.initState();
    _scrollController = ScrollController();
    _messagesString = [
      "BREAKING: ${widget.teamName.toUpperCase()} MANAGER SPOTTED AT MIDNIGHT TACTICS SESSION • ",
      "EXCLUSIVE: DRESSING ROOM SOURCES REVEAL TACTICAL MASTERCLASS INCOMING • ",
      "LIVE: BOARD CONFIDENCE WAVERING AFTER LATEST PERFORMANCE • ",
      "ALERT: FAN PROTESTS PLANNED IF RESULTS DON'T IMPROVE • ",
      "RUMOR: EMERGENCY MEETING SCHEDULED WITH CLUB HIERARCHY • ",
      "UPDATE: SQUAD MORALE AT ALL-TIME HIGH AFTER TRAINING GROUND BREAKTHROUGH • ",
    ].join();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      _timer = Timer.periodic(const Duration(milliseconds: 100), (t) {
        if (!mounted) {
          t.cancel();
          return;
        }
        if (_scrollController.hasClients) {
          double maxScroll = _scrollController.position.maxScrollExtent;
          double currentScroll = _scrollController.offset;

          if (currentScroll >= maxScroll - 5) {
            _scrollController.jumpTo(0);
          } else {
            _scrollController.animateTo(currentScroll + 10.0,
                duration: const Duration(milliseconds: 100),
                curve: Curves.linear);
          }
        }
      });
    });
  }

  late String _messagesString;

  @override
  void dispose() {
    _timer?.cancel();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
        height: 45,
        color: kBlack,
        child: ListView.builder(
            controller: _scrollController,
            scrollDirection: Axis.horizontal,
            physics: const NeverScrollableScrollPhysics(),
            itemBuilder: (c, i) => Center(
                child: Text(_messagesString,
                    style: const TextStyle(
                        color: kNeonYellow,
                        fontWeight: FontWeight.w900,
                        fontSize: 16,
                        fontStyle: FontStyle.italic)))));
  }
}
