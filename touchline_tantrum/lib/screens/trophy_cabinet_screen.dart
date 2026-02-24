import 'package:flutter/material.dart';
import 'package:touchline_tantrum/utils/trophy_manager.dart';
import '../utils/constants.dart';
import '../widgets/trophy_cabinet.dart';

class TrophyCabinetScreen extends StatefulWidget {
  const TrophyCabinetScreen({super.key});

  @override
  State<TrophyCabinetScreen> createState() => _TrophyCabinetScreenState();
}

class _TrophyCabinetScreenState extends State<TrophyCabinetScreen> {
  final TrophyManager _trophyManager = TrophyManager();
  Map<String, int> _winsBySaga = {};

  @override
  void initState() {
    super.initState();
    _loadWins();
  }

  Future<void> _loadWins() async {
    final wins = await _trophyManager.getWins();
    final Map<String, int> winsBySaga = {
      'bottle': 0,
      'top4': 0,
      'escape': 0,
    };

    for (String win in wins) {
      if (winsBySaga.containsKey(win)) {
        winsBySaga[win] = winsBySaga[win]! + 1;
      }
    }

    setState(() {
      _winsBySaga = winsBySaga;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBlack,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text(
          'TROPHY CABINET',
          style: TextStyle(
            fontWeight: FontWeight.w900,
            fontSize: 24,
            letterSpacing: 3,
            color: Colors.white,
          ),
        ),
        centerTitle: true,
      ),
      body: Center(
        child: SingleChildScrollView(
          child: TrophyCabinet(winsBySaga: _winsBySaga),
        ),
      ),
    );
  }
}
