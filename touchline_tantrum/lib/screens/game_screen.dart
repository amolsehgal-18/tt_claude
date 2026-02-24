import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:csv/csv.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:async';
import 'dart:math';
import 'dart:convert';

import '../utils/constants.dart';
import '../utils/settings_manager.dart';
import '../utils/audio_manager.dart';
import '../utils/trophy_manager.dart';
import '../models/active_game_session.dart';
import '../models/team.dart';
import '../models/game_card_data.dart';
import '../widgets/stat_rings.dart';
import '../widgets/breaking_news_ticker.dart';
import '../widgets/team_logo.dart';
import '../widgets/slant_button.dart';
import '../widgets/match_radar.dart';
import '../widgets/manager_mood.dart';

class GameScreen extends StatefulWidget {
  final ActiveGameSession session;
  const GameScreen({super.key, required this.session});
  @override
  State<GameScreen> createState() => _GameScreenState();
}

class _GameScreenState extends State<GameScreen> {
  SharedPreferences? _prefs;
  late int matchesPlayed, matchesTotal, currentGW, cardsUntilMatch, wildcards;
  double boardTrust = 0.5,
      fanSupport = 0.5,
      dressingRoom = 0.5,
      aggression = 0.45,
      _timerVal = 1.0;
  ManagerState currentMood = ManagerState.neutral;
  List<Team> leagueTable = [];
  Team? nextOpponent;
  List<GameCardData> _masterDeck = [];
  GameCardData? activeScenario;
  bool isReady = false,
      isMatchDay = false,
      isSacked = false,
      isWon = false,
      isSimulating = false,
      _isProcessing = false;
  String simText = "";
  int _matchPhase = 0;
  Timer? _gameTimer;
  bool _lastMatchWon = false;

  @override
  void initState() {
    super.initState();
    _initializeGame();
  }

  Future<void> _initializeGame() async {
    await SettingsManager.instance.load();
    await AudioManager.instance.initialize();
    _prefs = await SharedPreferences.getInstance();

    if (!mounted) return;

    final loaded = await _loadGame();
    if (!mounted) return;

    if (loaded) {
      final savedSessionJson = _prefs?.getString('saved_session');
      bool sessionMatches = false;
      if (savedSessionJson != null) {
        final savedSession =
            ActiveGameSession.fromJson(jsonDecode(savedSessionJson));
        if (savedSession.id == widget.session.id &&
            savedSession.userName == widget.session.userName) {
          sessionMatches = true;
        }
      }

      if (sessionMatches) {
        setState(() {
          isReady = true;
          _updateMood();
          _nextCard();
        });
        return;
      } else {
        debugPrint("Session mismatch - starting fresh game");
      }
    }

    matchesPlayed = 0;
    matchesTotal = widget.session.totalMatches;
    currentGW = widget.session.startWeek + 1;
    cardsUntilMatch = 3;
    wildcards = 3;
    _initLeague();
    _loadCSV();
  }

  @override
  void dispose() {
    _gameTimer?.cancel();
    super.dispose();
  }

  Future<void> _loadCSV() async {
    try {
      final raw = await rootBundle.loadString("assets/cards.csv");
      List<List<dynamic>> list = const CsvToListConverter().convert(raw);
      List<GameCardData> tempDeck = [];
      for (var row in list.skip(1)) {
        if (row.length >= 7) {
          tempDeck.add(GameCardData(
              row[0].toString(),
              row[1].toString(),
              row[2].toString(),
              int.tryParse(row[3].toString()) ?? 0,
              int.tryParse(row[4].toString()) ?? 0,
              int.tryParse(row[5].toString()) ?? 0,
              double.tryParse(row[6].toString()) ?? 0.05));
        }
      }
      if (!mounted) return;
      setState(() {
        _masterDeck = tempDeck..shuffle();
        isReady = true;
        _updateMood();
        _nextCard();
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _masterDeck = [
          GameCardData("PR: Squad moral low", "Team Dinner", "Hairdryer", 5, 5,
              -10, 0.05)
        ];
        isReady = true;
        _updateMood();
        _nextCard();
      });
    }
  }

  Future<void> _saveGame() async {
    final prefs = _prefs;
    if (prefs == null) return;
    await prefs.setDouble('saved_board', boardTrust);
    await prefs.setDouble('saved_fans', fanSupport);
    await prefs.setDouble('saved_dr', dressingRoom);
    await prefs.setDouble('saved_aggression', aggression);
    await prefs.setInt('saved_gw', currentGW);
    await prefs.setInt('saved_matches', matchesPlayed);
    await prefs.setInt('saved_cards', cardsUntilMatch);
    await prefs.setInt('saved_wildcards', wildcards);
    await prefs.setInt('saved_total_matches', matchesTotal);
    final leagueJson = leagueTable.map((t) => t.toJson()).toList();
    await prefs.setString('saved_league', jsonEncode(leagueJson));
    if (nextOpponent != null) {
      await prefs.setString(
          'saved_opponent', jsonEncode(nextOpponent?.toJson() ?? {}));
    }
    await prefs.setString('saved_session', jsonEncode(widget.session.toJson()));
  }

  Future<void> _clearSave() async {
    final prefs = _prefs;
    if (prefs == null) return;
    await prefs.remove('saved_board');
    await prefs.remove('saved_fans');
    await prefs.remove('saved_dr');
    await prefs.remove('saved_aggression');
    await prefs.remove('saved_gw');
    await prefs.remove('saved_matches');
    await prefs.remove('saved_cards');
    await prefs.remove('saved_wildcards');
    await prefs.remove('saved_total_matches');
    await prefs.remove('saved_league');
    await prefs.remove('saved_opponent');
    await prefs.remove('saved_session');
  }

  Future<bool> _loadGame() async {
    if (_prefs == null) return false;
    final prefs = _prefs!;
    if (!prefs.containsKey('saved_board')) return false;
    try {
      boardTrust = prefs.getDouble('saved_board') ?? 0.5;
      fanSupport = prefs.getDouble('saved_fans') ?? 0.5;
      dressingRoom = prefs.getDouble('saved_dr') ?? 0.5;
      aggression = prefs.getDouble('saved_aggression') ?? 0.5;
      currentGW = prefs.getInt('saved_gw') ?? 1;
      matchesPlayed = prefs.getInt('saved_matches') ?? 0;
      cardsUntilMatch = prefs.getInt('saved_cards') ?? 3;
      wildcards = prefs.getInt('saved_wildcards') ?? 2;
      matchesTotal = prefs.getInt('saved_total_matches') ?? 10;
      final leagueString = prefs.getString('saved_league');
      if (leagueString != null) {
        final leagueJson = jsonDecode(leagueString) as List;
        leagueTable = leagueJson
            .map((t) => Team.fromJson(t as Map<String, dynamic>))
            .toList();
      }
      final opponentString = prefs.getString('saved_opponent');
      if (opponentString != null) {
        nextOpponent =
            Team.fromJson(jsonDecode(opponentString) as Map<String, dynamic>);
      }
      return true;
    } catch (e) {
      debugPrint('Error loading game: $e');
      return false;
    }
  }

  void _nextCard() {
    if (matchesPlayed >= matchesTotal) {
      _checkWinCondition();
      return;
    }
    if (cardsUntilMatch > 0) {
      setState(() {
        isMatchDay = false;
        if (_masterDeck.isEmpty) {
          activeScenario = GameCardData(
              "Season Finale", "STAY FOCUSED", "CONTINUE", 0, 0, 0, 0.05);
        } else {
          activeScenario =
              (List<GameCardData>.from(_masterDeck)..shuffle()).first;
        }
        _timerVal = 1.0;
        _isProcessing = false;
        _startPressureTimer();
      });
    } else {
      _startNitroReel();
    }
  }

  void _startPressureTimer() {
    _gameTimer?.cancel();
    _gameTimer = Timer.periodic(const Duration(milliseconds: 100), (t) {
      if (!mounted) {
        t.cancel();
        return;
      }
      setState(() {
        _timerVal -= 1 / 150;
        if (_timerVal <= 0) {
          t.cancel();
          _handleSwipe(true);
        }
      });
    });
  }

  void _handleSwipe(bool isLeft) {
    if (_isProcessing) return;
    _isProcessing = true;
    _gameTimer?.cancel();
    if (isMatchDay) {
      _finishMatch(isLeft);
      return;
    }
    final c = activeScenario;
    if (c == null) return;
    if (SettingsManager.instance.hapticsEnabled) {
      if (isLeft) {
        HapticFeedback.mediumImpact();
      } else {
        HapticFeedback.heavyImpact();
      }
    }
    AudioManager.instance.playSwipeSound(isLeft);
    int m = isLeft ? 1 : -1;
    setState(() {
      boardTrust = (boardTrust + (c.boardImpact * m / 100)).clamp(0.01, 1.0);
      fanSupport = (fanSupport + (c.fanImpact * m / 100)).clamp(0.01, 1.0);
      dressingRoom =
          (dressingRoom + (c.dressingRoomImpact * m / 100)).clamp(0.01, 1.0);
      aggression =
          (aggression + (isLeft ? c.aggressionShift : -c.aggressionShift))
              .clamp(0.1, 1.0);
      cardsUntilMatch--;
      _updateMood();
      _nextCard();
    });
    if (mounted) {
      _saveGame();
    }
  }

  void _updateMood() {
    if (isSacked) {
      currentMood = ManagerState.sacked;
      return;
    }

    double avgSupport = (boardTrust + fanSupport + dressingRoom) / 3;
    int rank = _getUserRank();
    int gamesRemaining = matchesTotal - matchesPlayed;

    // Start with a base mood from support levels
    ManagerState mood;
    if (avgSupport >= 0.7) {
      mood = ManagerState.happy;
    } else if (avgSupport >= 0.5) {
      mood = ManagerState.neutral;
    } else if (avgSupport >= 0.3) {
      mood = ManagerState.stressed;
    } else {
      mood = ManagerState.angry;
    }

    // Factor in recent match result
    if (_lastMatchWon && mood == ManagerState.stressed) {
      mood = ManagerState.neutral;
    } else if (!_lastMatchWon && mood == ManagerState.neutral) {
      mood = ManagerState.stressed;
    }

    // Factor in league position and season progression
    if (gamesRemaining < 5) { // High-stakes end of season
      if (rank == 2) {
        mood = ManagerState.stressed;
      } else if (rank > 4) { // Assuming a top team
        mood = ManagerState.angry;
      }
    }

    setState(() {
      currentMood = mood;
    });
  }

  int _getUserRank() {
    int myIdx =
        leagueTable.indexWhere((t) => t.name == widget.session.userName.toUpperCase());
    return myIdx == -1 ? 20 : myIdx + 1;
  }

  void _startNitroReel() {
    if (!mounted) return;
    setState(() {
      isSimulating = true;
      isMatchDay = true;
      _matchPhase = 0;
      final pool = kChronologicalPool[0] ?? ["Match underway..."];
      simText = pool[Random().nextInt(pool.length)];
    });
    Future.delayed(const Duration(milliseconds: 1500), () {
      if (mounted) _runRemainingSegments();
    });
  }

  void _runRemainingSegments() {
    _gameTimer?.cancel();
    _gameTimer = Timer.periodic(const Duration(milliseconds: 1500), (t) {
      if (!mounted) {
        t.cancel();
        return;
      }
      if (_matchPhase >= 2) {
        t.cancel();
        _triggerReelResult();
      } else {
        setState(() {
          _matchPhase++;
          final pool =
              kChronologicalPool[_matchPhase] ?? ["The game continues..."];
          simText = pool[Random().nextInt(pool.length)];
        });
      }
    });
  }

  void _initLeague() {
    List<Map<String, dynamic>> clubs = [
      {"name": "CITY BLUE", "strength": 0.95},
      {"name": "MAN REDS", "strength": 0.85},
      {"name": "LIVER RED", "strength": 0.90},
      {"name": "NORTH FC", "strength": 0.88},
      {"name": "LONDON BLUE", "strength": 0.82},
      {"name": "VILLA", "strength": 0.78},
      {"name": "CASTLE", "strength": 0.76},
      {"name": "GULLS", "strength": 0.70},
      {"name": "HAMMERS", "strength": 0.65},
      {"name": "WOLVES", "strength": 0.60},
      {"name": "FOXES", "strength": 0.55},
      {"name": "BEES", "strength": 0.50},
      {"name": "TOFFEES", "strength": 0.45},
      {"name": "TREES", "strength": 0.40},
      {"name": "CHERRY", "strength": 0.35},
      {"name": "HATTERS", "strength": 0.30},
      {"name": "CLARETS", "strength": 0.25},
      {"name": "BLADES", "strength": 0.20},
      {"name": "EAGLES", "strength": 0.15}
    ];

    List<Team> rivals = [];
    int gamesAlreadyPlayed = (38 - matchesTotal).clamp(0, 38).toInt();
    for (var club in clubs) {
      double strength = club["strength"] as double;
      double ppg = 0.8 + (strength * 1.6);
      double variance = 0.9 + (Random().nextDouble() * 0.2);
      int initialPoints = (ppg * gamesAlreadyPlayed * variance).toInt();
      rivals.add(Team(club["name"], initialPoints, Random().nextInt(1000),
          strength: strength));
    }
    rivals.sort((a, b) => b.points.compareTo(a.points));
    Team userTeam = Team(
        widget.session.userName.toUpperCase(), 0, widget.session.userLogo,
        strength: 0.6);
    if (gamesAlreadyPlayed > 0) {
      if (widget.session.id == "bottle") {
        if (rivals.isNotEmpty) {
          userTeam.points = rivals[0].points + 2;
        }
      } else if (widget.session.id == "top4") {
        if (rivals.length >= 4) {
          userTeam.points = rivals[3].points;
        } else if (rivals.isNotEmpty) {
          userTeam.points = rivals.last.points;
        }
      } else if (widget.session.id == "escape") {
        if (rivals.length >= 17) {
          userTeam.points = rivals[16].points;
        } else if (rivals.isNotEmpty) {
          userTeam.points = 0;
        }
      } else {
        double midPPG = 1.3;
        userTeam.points = (midPPG * gamesAlreadyPlayed).toInt();
      }
    }
    rivals.add(userTeam);
    leagueTable = rivals;
    _sortLeague();
    _pickOpponent();
  }

  void _sortLeague() =>
      leagueTable.sort((a, b) => b.points.compareTo(a.points));

  void _pickOpponent() {
    var ops = leagueTable
        .where((t) => t.name != widget.session.userName.toUpperCase())
        .toList();
    if (ops.isEmpty) return;
    nextOpponent = ops[Random().nextInt(ops.length)];
  }

  void _triggerReelResult() {
    setState(() {
      isSimulating = false;
      double strengthDiff = (0.6 - (nextOpponent?.strength ?? 0.5));
      double winProb = 0.35 +
          (aggression * 0.15) +
          (dressingRoom * 0.15) +
          (strengthDiff * 0.4);
      _lastMatchWon = Random().nextDouble() < winProb.clamp(0.1, 0.9);
      AudioManager.instance.playMatchSound(_lastMatchWon);
      if (SettingsManager.instance.hapticsEnabled) {
        if (_lastMatchWon) {
          HapticFeedback.heavyImpact();
        } else {
          HapticFeedback.vibrate();
        }
      }
      for (var team in leagueTable) {
        if (team.name != widget.session.userName.toUpperCase()) {
          double roll = Random().nextDouble();
          if (roll < team.strength * 0.6) {
            team.points += 3;
          } else if (roll < team.strength * 0.85) {
            team.points += 1;
          }
        }
      }
      _sortLeague();
      _updateMood();
      activeScenario = GameCardData(
          _lastMatchWon ? "WIN! 2-1" : "LOSS! 0-1",
          _lastMatchWon ? "STAY HUMBLE" : "VAR APPEAL ($wildcards)",
          _lastMatchWon ? "CELEBRATE" : "CONTINUE",
          0, 0, 0, 0,
          isMatchResult: true);
      _isProcessing = false;
    });
  }

  void _finishMatch(bool isLeft) {
    _gameTimer?.cancel();
    if (activeScenario == null) {
      _isProcessing = false;
      return;
    }
    bool won = (activeScenario?.text ?? "").contains("WIN");
    if (!won &&
        isLeft &&
        wildcards >= 1 &&
        (activeScenario?.leftOption.contains("VAR APPEAL") ?? false)) {
      setState(() {
        wildcards--;
        bool overturned = Random().nextBool();
        if (overturned) {
          _lastMatchWon = true;
          activeScenario = GameCardData(
              "WIN! (VAR OVERTURN)", "STAY HUMBLE", "CELEBRATE", 0, 0, 0, 0,
              isMatchResult: true);
          leagueTable
              .where((t) => t.name == widget.session.userName.toUpperCase())
              .forEach((t) => t.points += 3);
          _sortLeague();
        } else {
          activeScenario = GameCardData("LOSS! (VAR REJECTED)", "ACCEPT FATE",
              "SACK BOARD", 0, -10, -10, 0,
              isMatchResult: true);
        }
        _isProcessing = false;
        _updateMood();
      });
      return;
    }
    setState(() {
      if (won) {
        leagueTable
            .where((t) => t.name == widget.session.userName.toUpperCase())
            .forEach((t) => t.points += 3);
      }
      _sortLeague();
      matchesPlayed++;
      currentGW++;
      cardsUntilMatch = 3;
      if (matchesPlayed >= matchesTotal) {
        _checkWinCondition();
      } else {
        _pickOpponent();
        _nextCard();
      }
    });
  }

  void _checkWinCondition() async {
    int userIdx =
        leagueTable.indexWhere((t) => t.name == widget.session.userName.toUpperCase());
    int rank = userIdx == -1 ? 20 : userIdx + 1;
    bool objectiveMet = (widget.session.id == "career") ||
        (widget.session.id == "bottle" && rank == 1) ||
        (widget.session.id == "top4" && rank <= 4) ||
        (widget.session.id == "escape" && rank <= 17);

    bool supportLow =
        boardTrust <= 0.05 || fanSupport <= 0.05 || dressingRoom <= 0.05;

    if (objectiveMet && !supportLow) {
      final trophyManager = TrophyManager();
      if (widget.session.id != 'career') {
        await trophyManager.addWin(widget.session.id);
      }
      setState(() => isWon = true);
    } else {
      setState(() => isSacked = true);
    }
    _clearSave();
  }

  List<Team> _getSlice() {
    int myIdx =
        leagueTable.indexWhere((t) => t.name == widget.session.userName.toUpperCase());
    if (myIdx == -1) return leagueTable.take(4).toList();
    int start = (myIdx - 1).clamp(0, max(0, leagueTable.length - 4));
    return leagueTable.sublist(start, min(start + 4, leagueTable.length));
  }

  @override
  Widget build(BuildContext context) {
    if (!isReady) {
      return const Scaffold(
          body: Center(child: CircularProgressIndicator(color: kNeonYellow)));
    }
    if (isSacked || isWon) return _endOverlay();
    return Scaffold(
      body: Stack(children: [
        Positioned.fill(
            child: Opacity(
                opacity: 0.1,
                child: Image.asset(
                    "assets/images/backgrounds/stadium/pitch.png",
                    fit: BoxFit.cover,
                    errorBuilder: (c, e, s) => Container(color: kBlack)))),
        SafeArea(
          child: Column(children: [
            LinearProgressIndicator(
                value: _timerVal,
                color: kNeonYellow,
                backgroundColor: Colors.white10,
                minHeight: 6),
            Expanded(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _verticalTable(),
                  _statsRow(),
                  _mainActionCard(),
                  if (!isSimulating &&
                      activeScenario != null &&
                      !(activeScenario?.isMatchResult ?? false)) ...[
                    Text("${cardsUntilMatch * 2} DAYS TO KICKOFF",
                        style: const TextStyle(
                            color: Colors.white,
                            fontSize: 13,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 2)),
                    _logosRow(size: 45),
                    Text(
                        "${widget.session.userName.toUpperCase()} VS ${nextOpponent?.name ?? 'TBA'}",
                        style: const TextStyle(
                            fontSize: 12,
                            color: Colors.white70,
                            fontWeight: FontWeight.bold)),
                    Column(
                      children: [
                        const Text("MATCH ODDS",
                            style: TextStyle(
                                color: kNeonYellow,
                                fontSize: 11,
                                fontWeight: FontWeight.w900)),
                        const SizedBox(height: 2),
                        Text(
                            "${(2.20 - (aggression * 0.8)).toStringAsFixed(2)} | 3.40 | ${(2.40 + (aggression * 1.2)).toStringAsFixed(2)}",
                            style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w900,
                                color: Colors.white,
                                letterSpacing: 2)),
                      ],
                    ),
                  ],
                ],
              ),
            ),
            if (!isSimulating)
              Padding(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  child: _actionBtns()),
            BreakingNewsTicker(teamName: widget.session.userName),
          ]),
        ),
      ]),
    );
  }

  Widget _statsRow() {
    if (isSimulating) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 20),
        child: Center(child: MatchRadar()),
      );
    }
    return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20.0),
        child: Row(crossAxisAlignment: CrossAxisAlignment.center, children: [
          Expanded(
              child: Column(mainAxisSize: MainAxisSize.min, children: [
            StatRings(
              board: boardTrust,
              dressingRoom: dressingRoom,
              fans: fanSupport,
              size: 115,
            ),
            const SizedBox(height: 10),
            _fullLegendItem("BOARD", boardTrust, kElectricBlue),
            const SizedBox(height: 5),
            _fullLegendItem("SQUAD", dressingRoom, kGold),
            const SizedBox(height: 5),
            _fullLegendItem("FANS", fanSupport, kDeepRed),
          ])),
          const SizedBox(width: 20),
          Expanded(
            child: ManagerMood(
              size: 100,
              mood: currentMood,
            ),
          ),
        ]));
  }

  Widget _fullLegendItem(String label, double value, Color color) =>
      Row(mainAxisAlignment: MainAxisAlignment.center, children: [
        Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
        const SizedBox(width: 6),
        Text("$label - ${(value * 100).toInt()}%",
            style: const TextStyle(
              color: Colors.white70,
              fontSize: 11,
              fontWeight: FontWeight.bold,
              fontFamily: 'sans-serif',
            ))
      ]);

  Widget _mainActionCard() => Column(children: [
        Container(
          width: MediaQuery.of(context).size.width * 0.82,
          padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
          decoration: BoxDecoration(
              color: isSimulating
                  ? Colors.white
                  : ((activeScenario?.isMatchResult ?? false)
                      ? Colors.black87
                      : Colors.grey.shade200),
              borderRadius: BorderRadius.circular(4),
              border: Border.all(color: Colors.white10, width: 2)),
          child: Text(
              isSimulating
                  ? simText.toUpperCase()
                  : (activeScenario?.text ?? ""),
              textAlign: TextAlign.center,
              style: TextStyle(
                  color: isSimulating
                      ? kBlack
                      : (activeScenario?.isMatchResult ?? false
                          ? kGold
                          : kBlack),
                  fontSize: activeScenario?.isMatchResult ?? false ? 30 : 18,
                  fontWeight: FontWeight.w900)),
        ),
        if (activeScenario?.isMatchResult ?? false) ...[
          const SizedBox(height: 5),
          const Text("NEXT MATCH",
              style: TextStyle(
                  color: Colors.grey,
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.2)),
          const SizedBox(height: 5),
          _resultRowWithNames()
        ]
      ]);

  Widget _resultRowWithNames() => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
        child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
          Expanded(
              child: Text(widget.session.userName.toUpperCase(),
                  textAlign: TextAlign.right,
                  style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: kNeonYellow))),
          const SizedBox(width: 15),
          TeamLogo(seed: widget.session.userLogo, size: 55, isLight: true),
          const Padding(
              padding: EdgeInsets.symmetric(horizontal: 15),
              child: Text("VS",
                  style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w900,
                      color: Colors.white))),
          TeamLogo(seed: nextOpponent?.iconSeed ?? 0, size: 45, isLight: true),
          const SizedBox(width: 15),
          Expanded(
              child: Text(nextOpponent?.name ?? "",
                  textAlign: TextAlign.left,
                  style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: Colors.white))),
        ]),
      );

  Widget _logosRow({required double size}) =>
      Row(mainAxisAlignment: MainAxisAlignment.center, children: [
        TeamLogo(seed: widget.session.userLogo, size: size, isLight: true),
        Padding(
            padding: const EdgeInsets.symmetric(horizontal: 25),
            child: Text("VS",
                style: TextStyle(
                    fontSize: size * 0.6,
                    fontWeight: FontWeight.w900,
                    color: Colors.white))),
        TeamLogo(seed: nextOpponent?.iconSeed ?? 0, size: size, isLight: true),
      ]);

  Widget _verticalTable() => Container(
      width: MediaQuery.of(context).size.width * 0.85,
      padding:
          const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
          color: Colors.black87,
          borderRadius: BorderRadius.circular(4),
          border: Border.all(color: Colors.white10)),
      child: Column(children: [
        Text(widget.session.objective.toUpperCase(),
            style: const TextStyle(
                color: kNeonYellow, fontSize: 12, fontWeight: FontWeight.w900)),
        const SizedBox(height: 3),
        Text("GW $currentGW",
            style: const TextStyle(
                color: Colors.white,
                fontSize: 14,
                fontWeight: FontWeight.bold)),
        const Divider(color: Colors.white24, height: 12),
        const Padding(
          padding: EdgeInsets.only(bottom: 5),
          child: Row(children: [
            SizedBox(
                width: 25,
                child: Text("#",
                    style: TextStyle(
                        fontSize: 14,
                        color: Colors.white,
                        fontWeight: FontWeight.bold))),
            SizedBox(width: 8),
            Expanded(
                flex: 4,
                child: Text("Club Name",
                    style: TextStyle(
                        fontSize: 14,
                        color: Colors.white,
                        fontWeight: FontWeight.bold))),
            SizedBox(width: 8),
            SizedBox(
                width: 40,
                child: Text("G",
                    textAlign: TextAlign.center,
                    style: TextStyle(
                        fontSize: 14,
                        color: Colors.white,
                        fontWeight: FontWeight.bold))),
            SizedBox(width: 8),
            SizedBox(
                width: 40,
                child: Text("P",
                    textAlign: TextAlign.center,
                    style: TextStyle(
                        fontSize: 14,
                        color: Colors.white,
                        fontWeight: FontWeight.bold))),
          ]),
        ),
        ..._getSlice()
            .map((t) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 3),
                child: Row(children: [
                  SizedBox(
                      width: 25,
                      child: Text("${leagueTable.indexOf(t) + 1}",
                          style: TextStyle(
                              fontSize: 13,
                              color: t.name ==
                                      widget.session.userName.toUpperCase()
                                  ? kNeonYellow
                                  : Colors.white38,
                              fontWeight: t.name ==
                                      widget.session.userName.toUpperCase()
                                  ? FontWeight.bold
                                  : FontWeight.normal))),
                  const SizedBox(width: 8),
                  Expanded(
                      flex: 4,
                      child: Text(t.name,
                          style: TextStyle(
                              fontSize: 13,
                              color: t.name ==
                                      widget.session.userName.toUpperCase()
                                  ? kNeonYellow
                                  : Colors.white38,
                              fontWeight: t.name ==
                                      widget.session.userName.toUpperCase()
                                  ? FontWeight.bold
                                  : FontWeight.normal))),
                  const SizedBox(width: 8),
                  SizedBox(
                      width: 40,
                      child: Text("$currentGW",
                          textAlign: TextAlign.center,
                          style: TextStyle(
                              fontSize: 13,
                              color: t.name ==
                                      widget.session.userName.toUpperCase()
                                  ? kNeonYellow
                                  : Colors.white38))),
                  const SizedBox(width: 8),
                  SizedBox(
                      width: 40,
                      child: Text("${t.points}",
                          textAlign: TextAlign.center,
                          style: TextStyle(
                              fontSize: 13,
                              color: t.name ==
                                      widget.session.userName.toUpperCase()
                                  ? kNeonYellow
                                  : Colors.white38)))
                ])))
            .toList()
      ]));

  Widget _actionBtns() {
    if (activeScenario == null) return const SizedBox.shrink();
    return Row(mainAxisAlignment: MainAxisAlignment.center, children: [
      SlantButton(
          text: activeScenario?.leftOption ?? "Decision",
          color: kSlateBlue,
          isLeft: true,
          onTap: () => _handleSwipe(true)),
      SlantButton(
          text: activeScenario?.rightOption ?? "Continue",
          color: kSteelGray,
          isLeft: false,
          onTap: () => _handleSwipe(false))
    ]);
  }

  Widget _endOverlay() {
    final String bgImage = isWon
        ? 'assets/images/backgrounds/bg_victory.png'
        : 'assets/images/backgrounds/bg_sacked.png';

    return Scaffold(
      body: Stack(
        fit: StackFit.expand,
        children: [
          Image.asset(
            bgImage,
            fit: BoxFit.cover,
          ),
          Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (isSacked)
                  Image.asset(
                    'assets/images/manager/man_sacked.png',
                    height: 150,
                  ),
                Text(
                  isWon ? "SAGA COMPLETE" : "CONTRACT TERMINATED",
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.w900,
                    color: Colors.white,
                    shadows: [
                      Shadow(
                        blurRadius: 10.0,
                        color: Colors.black,
                        offset: Offset(5.0, 5.0),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 40),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: kBlack.withAlpha((255 * 0.5).round()),
                    side: const BorderSide(color: Colors.white, width: 2),
                  ),
                  onPressed: () => Navigator.popUntil(context, (r) => r.isFirst),
                  child: const Text(
                    "MAIN MENU",
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
