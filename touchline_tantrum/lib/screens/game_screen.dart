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

  @override
  void initState() {
    super.initState();
    _initializeGame();
  }

  Future<void> _initializeGame() async {
    // Initialize managers
    await SettingsManager.instance.load();
    await AudioManager.instance.initialize();
    _prefs = await SharedPreferences.getInstance();

    if (!mounted) return;

    // Try to load saved game
    final loaded = await _loadGame();
    if (!mounted) return;

    if (loaded) {
      // Session verification: ensure loaded session matches current session
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
          _nextCard();
        });
        return;
      } else {
        debugPrint("Session mismatch - starting fresh game");
      }
    }

    // Initialize new game
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
        _nextCard();
      });
    }
  }

  Future<void> _saveGame() async {
    final prefs = _prefs;
    if (prefs == null) return;
    // Save basic stats
    await prefs.setDouble('saved_board', boardTrust);
    await prefs.setDouble('saved_fans', fanSupport);
    await prefs.setDouble('saved_dr', dressingRoom);
    await prefs.setDouble('saved_aggression', aggression);

    // Save game progress
    await prefs.setInt('saved_gw', currentGW);
    await prefs.setInt('saved_matches', matchesPlayed);
    await prefs.setInt('saved_cards', cardsUntilMatch);
    await prefs.setInt('saved_wildcards', wildcards);
    await prefs.setInt('saved_total_matches', matchesTotal);

    // Save league table as JSON
    final leagueJson = leagueTable.map((t) => t.toJson()).toList();
    await prefs.setString('saved_league', jsonEncode(leagueJson));

    // Save opponent
    if (nextOpponent != null) {
      await prefs.setString(
          'saved_opponent', jsonEncode(nextOpponent?.toJson() ?? {}));
    }

    // Save session data
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
    debugPrint("Game session cleared from storage");
  }

  Future<bool> _loadGame() async {
    if (_prefs == null) return false;
    final prefs = _prefs;
    if (prefs == null) return false;
    if (!prefs.containsKey('saved_board')) return false;

    try {
      // Load basic stats
      boardTrust = prefs.getDouble('saved_board') ?? 0.5;
      fanSupport = prefs.getDouble('saved_fans') ?? 0.5;
      dressingRoom = prefs.getDouble('saved_dr') ?? 0.5;
      aggression = prefs.getDouble('saved_aggression') ?? 0.5;

      // Load game progress
      currentGW = prefs.getInt('saved_gw') ?? 1;
      matchesPlayed = prefs.getInt('saved_matches') ?? 0;
      cardsUntilMatch = prefs.getInt('saved_cards') ?? 3;
      wildcards = prefs.getInt('saved_wildcards') ?? 2;
      matchesTotal = prefs.getInt('saved_total_matches') ?? 10;

      // Load league table
      final leagueString = prefs.getString('saved_league');
      if (leagueString != null) {
        final leagueJson = jsonDecode(leagueString) as List;
        leagueTable = leagueJson
            .map((t) => Team.fromJson(t as Map<String, dynamic>))
            .toList();
      }

      // Load opponent
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

    // Enhanced haptics based on direction
    if (SettingsManager.instance.hapticsEnabled) {
      if (isLeft) {
        HapticFeedback.mediumImpact();
      } else {
        HapticFeedback.heavyImpact();
      }
    }

    // Play swipe sound
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
      _updateMood(impact: c.boardImpact * m);
      if (boardTrust <= 0.05 || dressingRoom <= 0.05) {
        isSacked = true;
        currentMood = ManagerState.sacked;
      } else {
        _nextCard();
      }
    });
    if (mounted) {
      _saveGame();
    }
  }

  void _updateMood({int impact = 0, bool recentlyWon = false}) {
    if (recentlyWon) {
      currentMood = ManagerState.happy;
      return;
    }
    int userIdx = leagueTable
        .indexWhere((t) => t.name == widget.session.userName.toUpperCase());
    int myRank = userIdx == -1 ? 10 : userIdx + 1;

    bool onTrack = (widget.session.id == "bottle" && myRank == 1) ||
        (widget.session.id == "top4" && myRank <= 4) ||
        (widget.session.id == "career");
    if (!onTrack) {
      currentMood = ManagerState.stressed;
    } else {
      currentMood = (impact < -3)
          ? ManagerState.angry
          : (impact > 3 ? ManagerState.happy : ManagerState.neutral);
    }
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
      // Realistic PPG based on strength: Top teams ~2.3, Mid ~1.4, Low ~0.8
      double ppg = 0.8 + (strength * 1.6); // Maps 0.15->1.04, 0.95->2.32

      // Add randomness but adhere to history
      double variance = 0.9 + (Random().nextDouble() * 0.2); // 0.9 - 1.1
      int initialPoints = (ppg * gamesAlreadyPlayed * variance).toInt();

      rivals.add(Team(club["name"], initialPoints, Random().nextInt(1000),
          strength: strength));
    }

    // Sort rivals first to determine positions
    rivals.sort((a, b) => b.points.compareTo(a.points));

    Team userTeam = Team(
        widget.session.userName.toUpperCase(), 0, widget.session.userLogo,
        strength: 0.6);

    // Logic to insert user at correct position based on game mode
    if (gamesAlreadyPlayed > 0) {
      if (widget.session.id == "bottle") {
        // Start 1st: Points = 1st place + 2
        if (rivals.isNotEmpty) {
          userTeam.points = rivals[0].points + 2;
        }
      } else if (widget.session.id == "top4") {
        // Start 4th: Points = 4th place (or close to it)
        if (rivals.length >= 4) {
          userTeam.points = rivals[3].points;
        } else if (rivals.isNotEmpty) {
          userTeam.points = rivals.last.points;
        }
      } else if (widget.session.id == "escape") {
        // Start 17th: Points = 17th place (just above drop)
        if (rivals.length >= 17) {
          userTeam.points = rivals[16].points;
        } else if (rivals.isNotEmpty) {
          userTeam.points = 0;
        }
        // Ensure we are in "relegation vibe" but safe for now
      } else {
        // Career Mode: Start mid-table average
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
      // Calculate win probability based on strength difference
      // Base chance 30% + morale bonuses + strength diff
      double strengthDiff =
          (0.6 - (nextOpponent?.strength ?? 0.5)); // User assumed 0.6 for now
      double winProb = 0.35 +
          (aggression * 0.15) +
          (dressingRoom * 0.15) +
          (strengthDiff * 0.4);

      bool won = Random().nextDouble() < winProb.clamp(0.1, 0.9);

      // Play match result sound
      AudioManager.instance.playMatchSound(won);

      // Enhanced haptics for match result
      if (SettingsManager.instance.hapticsEnabled) {
        if (won) {
          HapticFeedback.heavyImpact();
        } else {
          HapticFeedback.vibrate();
        }
      }

      // Simulate other matches based on strength
      for (var team in leagueTable) {
        if (team.name != widget.session.userName.toUpperCase()) {
          // Simple simultation: stronger teams win more
          double roll = Random().nextDouble();
          if (roll < team.strength * 0.6) {
            team.points += 3;
          } else if (roll < team.strength * 0.85) {
            team.points += 1;
          }
        }
      }

      _sortLeague();
      _updateMood(recentlyWon: won);
      activeScenario = GameCardData(
          won ? "WIN! 2-1" : "LOSS! 0-1",
          won ? "STAY HUMBLE" : "VAR APPEAL ($wildcards)",
          won ? "CELEBRATE" : "CONTINUE",
          0,
          0,
          0,
          0,
          isMatchResult: true);
      _isProcessing = false; // ALLOW SWIPE/CLICK
    });
  }

  void _finishMatch(bool isLeft) {
    _gameTimer?.cancel(); // Safety
    if (activeScenario == null) {
      _isProcessing = false;
      return;
    }

    bool won = (activeScenario?.text ?? "").contains("WIN");

    // Handle VAR Appeal Logic
    if (!won &&
        isLeft &&
        wildcards >= 1 &&
        (activeScenario?.leftOption.contains("VAR APPEAL") ?? false)) {
      setState(() {
        wildcards--;
        // 50/50 chance of overturn
        bool overturned = Random().nextBool();
        if (overturned) {
          activeScenario = GameCardData(
              "WIN! (VAR OVERTURN)", "STAY HUMBLE", "CELEBRATE", 0, 0, 0, 0,
              isMatchResult: true);
          // Updating points for win
          leagueTable
              .where((t) => t.name == widget.session.userName.toUpperCase())
              .forEach((t) => t.points += 3);
          _sortLeague();
        } else {
          activeScenario = GameCardData("LOSS! (VAR REJECTED)", "ACCEPT FATE",
              "SACK BOARD", 0, -10, -10, 0,
              isMatchResult: true);
        }
        _isProcessing = false; // Reset flag to allow next input
      });
      return;
    }

    setState(() {
      if (won) {
        // Points already added in _triggerReelResult? No, wait.
        // We need to add points ONLY if we haven't already.
        // Actually, _triggerReelResult calculates 'won' boolean but doesn't add points to user yet?
        // Wait, looking at previous code, it didn't add points to user in _triggerReelResult.
        // It only added points to rivals. User points were added here.
        leagueTable
            .where((t) => t.name == widget.session.userName.toUpperCase())
            .forEach((t) => t.points += 3);
      } else {
        // Loss = 0 points. Draw logic not yet implemented fully but lets keep simple.
      }

      _sortLeague();
      matchesPlayed++;
      currentGW++;
      cardsUntilMatch = 3;

      if (matchesPlayed >= matchesTotal) {
        _checkWinCondition();
      } else {
        _pickOpponent();
        _nextCard(); // This handles resetting isMatchDay logic
      }
    });
  }

  void _checkWinCondition() async {
    int userIdx = leagueTable
        .indexWhere((t) => t.name == widget.session.userName.toUpperCase());
    int rank = userIdx == -1 ? 20 : userIdx + 1;
    bool success = (widget.session.id == "career") ||
        (widget.session.id == "bottle" && rank == 1) ||
        (widget.session.id == "top4" && rank <= 4) ||
        (widget.session.id == "escape" && rank <= 17);
    if (success) {
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
    int myIdx = leagueTable
        .indexWhere((t) => t.name == widget.session.userName.toUpperCase());
    if (myIdx == -1) return leagueTable.take(4).toList();

    // Show smaller slice (4 teams) to save space
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
                mainAxisAlignment:
                    MainAxisAlignment.spaceEvenly, // EVEN SPACING
                children: [
                  _verticalTable(),
                  _statsRow(), // 1. Pie chart + manager face
                  _mainActionCard(), // 2. Scenario
                  if (!isSimulating &&
                      activeScenario != null &&
                      !(activeScenario?.isMatchResult ?? false)) ...[
                    // 3. Days to kickoff
                    Text("${cardsUntilMatch * 2} DAYS TO KICKOFF",
                        style: const TextStyle(
                            color: Colors.white,
                            fontSize: 13,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 2)),
                    // 4. Logos
                    _logosRow(size: 45),
                    // 5. Teamname
                    Text(
                        "${widget.session.userName.toUpperCase()} VS ${nextOpponent?.name ?? 'TBA'}",
                        style: const TextStyle(
                            fontSize: 12,
                            color: Colors.white70,
                            fontWeight: FontWeight.bold)),
                    // 6. Match Odds
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
      padding: const EdgeInsets.symmetric(horizontal: 0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // LEFT HALF: Legend + Rings (Aligned to Right)
          Expanded(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _fullLegendItem("BOARD SUPPORT", kElectricBlue),
                    const SizedBox(height: 5),
                    _fullLegendItem("DRESSING ROOM", kGold),
                    const SizedBox(height: 5),
                    _fullLegendItem("FAN SUPPORT", kDeepRed),
                  ],
                ),
                const SizedBox(width: 10),
                StatRings(
                  board: boardTrust,
                  dressingRoom: dressingRoom,
                  fans: fanSupport,
                  size: 115, // Balanced size
                ),
              ],
            ),
          ),
          // CENTER GAP
          const SizedBox(width: 12),
          // RIGHT HALF: Manager (Aligned to Left)
          Expanded(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.only(left: 15),
                  child: Column(
                    children: [
                      SizedBox(
                        height: 95, // Balanced box
                        width: 95,
                        child: Stack(
                          children: [
                            Positioned(
                              top: 2,
                              left: 8,
                              child: ManagerMood(
                                size: 85,
                                boardTrust: boardTrust,
                                fanSupport: fanSupport,
                                dressingRoom: dressingRoom,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Padding(
                          padding: const EdgeInsets.only(top: 5),
                          child: Text(currentMood.name.toUpperCase(),
                              style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold)))
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _fullLegendItem(String label, Color color) => Row(children: [
        Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
        const SizedBox(width: 6),
        Text(label,
            style: const TextStyle(
                color: Colors.white70,
                fontSize: 10,
                fontWeight: FontWeight.bold))
      ]);

  Widget _mainActionCard() => Column(children: [
        Container(
          width: MediaQuery.of(context).size.width * 0.82, // Even narrower
          padding: const EdgeInsets.symmetric(
              vertical: 8, horizontal: 16), // Compressed padding
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
          const SizedBox(height: 5), // Reduced gap
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
          const EdgeInsets.symmetric(horizontal: 10, vertical: 4), // Tightened
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

enum ManagerState { neutral, happy, stressed, angry, sacked }
