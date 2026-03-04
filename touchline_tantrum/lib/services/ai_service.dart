import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../models/game_card_data.dart';
import '../utils/api_config.dart';

class AIService {
  static const String _apiUrl = 'https://api.anthropic.com/v1/messages';
  static const String _model = 'claude-haiku-4-5-20251001';

  static const String _systemPrompt = '''You are a scenario designer for "Touchline Tantrum", a mobile football manager card-swipe game.

GAME MECHANICS (understand these to write mechanically meaningful cards):
- Three stats (0–100%): Board Trust, Fan Support, Squad Morale — the "Tension Triangle"
- If ANY stat hits 0%, the manager is instantly sacked regardless of league position
- Aggression (0.10–1.0): directly controls match win probability and is shown as live betting odds
  Win probability = 0.35 + (aggression × 0.15) + (squad_morale_fraction × 0.15) + strength_factor
  Low aggression → safer style but lower win chance. High aggression → risky but higher win chance.
- Match odds formula: Win odds = (2.20 − aggression × 0.8), Loss odds = (2.40 + aggression × 1.2)
  So aggression 0.8 → 1.56 win odds (heavy favourite). Aggression 0.2 → 2.04 win odds (slight favourite).
- Manager stress is derived from average of all three triangle stats combined with recent match result

SCENARIO RULES:
- Both options MUST be genuine dilemmas — no clearly correct answer, both carry real costs
- Each scenario must be specific and vivid: name a situation, an archetype, a clash, a decision
- Scenarios should feel like real football management headlines (tabloid, training ground, boardroom)
- Option A label: 3–4 words, the bold/public/aggressive call
- Option B label: 3–4 words, the careful/private/composed call
- Think carefully about WHICH stats move and WHY — the impacts must make narrative sense
- Aggression shifts reflect whether the decision makes you play more attacking or defensively cautious
- Range: Board/Fans/Squad are integers −20 to +20. Aggression is decimal −0.10 to +0.10
- Impacts are DIRECT — positive means that stat goes UP, negative means it goes DOWN
- Do NOT mirror Option B as the inverse of Option A — they should have independent, asymmetric effects
- A bold public call may boost fans but anger the board. Staying quiet may protect the dressing room but lose public trust. Think through each stat independently.

OUTPUT FORMAT (exactly one line, no markdown, no extra text):
Scenario Text;Option A label;Option B label;BoardA,FansA,SquadA,AggroA;BoardB,FansB,SquadB,AggroB

EXAMPLE:
Your record signing hasn't scored in 8 games. Pundits are calling for his head.;Drop him publicly;Back him in press;12,-8,-10,0.04;-10,8,12,-0.03''';

  /// Generates a context-aware scenario card using the Claude API.
  /// Returns null if the API key is not configured or the call fails
  /// (caller should fall back to the CSV deck).
  Future<GameCardData?> generateScenario({
    required double boardTrust,
    required double fanSupport,
    required double dressingRoom,
    required double aggression,
    required bool lastMatchWon,
    required String teamName,
    required int leaguePosition,
    required int gamesRemaining,
    required String gameMode,
    required List<String> recentScenarios,
  }) async {
    if (kAnthropicApiKey.isEmpty || kAnthropicApiKey == 'YOUR_ANTHROPIC_API_KEY') {
      return null;
    }

    final winOdds = (2.20 - aggression * 0.8).toStringAsFixed(2);
    final lossOdds = (2.40 + aggression * 1.2).toStringAsFixed(2);

    // Identify pressure points to make scenarios more contextually dramatic
    final pressurePoints = <String>[];
    if (boardTrust < 0.30) pressurePoints.add('Board Trust critically low (${(boardTrust * 100).toInt()}%)');
    if (fanSupport < 0.30) pressurePoints.add('Fan Support critically low (${(fanSupport * 100).toInt()}%)');
    if (dressingRoom < 0.30) pressurePoints.add('Squad Morale critically low (${(dressingRoom * 100).toInt()}%)');
    if (gamesRemaining <= 4) pressurePoints.add('Season climax — only $gamesRemaining games left');
    if (!lastMatchWon && boardTrust < 0.50) pressurePoints.add('Board patience wearing thin after recent result');

    final pressureContext = pressurePoints.isEmpty
        ? 'No critical pressures — stable situation.'
        : pressurePoints.join('. ') + '.';

    final recentList = recentScenarios.isEmpty
        ? 'None yet.'
        : recentScenarios.map((s) => '- $s').join('\n');

    final gameModeLabel = switch (gameMode) {
      'bottle' => "DON'T BOTTLE IT (must finish 1st)",
      'top4' => 'TOP 4 IS LAVA (must finish top 4)',
      'escape' => 'THE GREAT ESCAPE (avoid relegation)',
      'career' => 'FULL CAREER (stay employed)',
      _ => gameMode,
    };

    final userPrompt = '''CURRENT GAME STATE — Team: ${teamName.toUpperCase()}
- Mode: $gameModeLabel
- League position: $leaguePosition of 20 | Games remaining: $gamesRemaining
- Board Trust: ${(boardTrust * 100).toInt()}% | Fan Support: ${(fanSupport * 100).toInt()}% | Squad Morale: ${(dressingRoom * 100).toInt()}%
- Aggression: ${aggression.toStringAsFixed(2)} → Live odds: $winOdds WIN | 3.40 DRAW | $lossOdds LOSS
- Last match: ${lastMatchWon ? "WON" : "LOST / DREW"}
- Pressure context: $pressureContext

RECENT SCENARIOS (do NOT repeat these themes or situations):
$recentList

Generate ONE fresh, specific scenario card now. Remember: make both options genuinely hard to choose between.''';

    try {
      final response = await http
          .post(
            Uri.parse(_apiUrl),
            headers: {
              'x-api-key': kAnthropicApiKey,
              'anthropic-version': '2023-06-01',
              'content-type': 'application/json',
            },
            body: jsonEncode({
              'model': _model,
              'max_tokens': 150,
              'system': _systemPrompt,
              'messages': [
                {'role': 'user', 'content': userPrompt},
              ],
            }),
          )
          .timeout(const Duration(seconds: 12));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        final contentList = data['content'] as List?;
        final text = contentList
            ?.whereType<Map>()
            .where((c) => c['type'] == 'text')
            .map((c) => c['text'] as String?)
            .firstWhere((t) => t != null, orElse: () => null);
        if (text != null) {
          return _parse(text.trim());
        }
      } else {
        debugPrint('AIService: API error ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('AIService: fetch failed — $e');
    }
    return null;
  }

  /// Parses the pipe-separated scenario format returned by Claude.
  /// Format: ScenarioText;OptionA;OptionB;BoardA,FansA,SquadA,AggroA;BoardB,FansB,SquadB,AggroB
  GameCardData? _parse(String raw) {
    // Strip any markdown code fences Claude might add
    final cleaned = raw.replaceAll('```', '').replaceAll('`', '').trim();

    // Find the line that matches the expected format (last one wins in case of preamble)
    String? candidate;
    for (final line in cleaned.split('\n').reversed) {
      final trimmed = line.trim();
      if (trimmed.contains(';') && trimmed.split(';').length >= 5) {
        candidate = trimmed;
        break;
      }
    }
    if (candidate == null) return null;

    final parts = candidate.split(';');
    if (parts.length < 5) return null;

    final scenarioText = parts[0].trim();
    final leftOpt = parts[1].trim();
    final rightOpt = parts[2].trim();
    if (scenarioText.isEmpty || leftOpt.isEmpty || rightOpt.isEmpty) return null;

    final aRaw = parts[3].trim().split(',');
    final bRaw = parts[4].trim().split(',');
    if (aRaw.length < 4 || bRaw.length < 4) return null;

    final boardA = int.tryParse(aRaw[0].trim());
    final fanA = int.tryParse(aRaw[1].trim());
    final squadA = int.tryParse(aRaw[2].trim());
    final aggroA = double.tryParse(aRaw[3].trim());

    final boardB = int.tryParse(bRaw[0].trim());
    final fanB = int.tryParse(bRaw[1].trim());
    final squadB = int.tryParse(bRaw[2].trim());
    final aggroB = double.tryParse(bRaw[3].trim());

    if (boardA == null || fanA == null || squadA == null || aggroA == null ||
        boardB == null || fanB == null || squadB == null || aggroB == null) {
      return null;
    }

    return GameCardData.withIndependentImpacts(
      text: scenarioText,
      leftOption: leftOpt,
      rightOption: rightOpt,
      boardImpactLeft: boardA.clamp(-20, 20),
      fanImpactLeft: fanA.clamp(-20, 20),
      dressingRoomImpactLeft: squadA.clamp(-20, 20),
      aggressionShiftLeft: aggroA.clamp(-0.10, 0.10),
      boardImpactRight: boardB.clamp(-20, 20),
      fanImpactRight: fanB.clamp(-20, 20),
      dressingRoomImpactRight: squadB.clamp(-20, 20),
      aggressionShiftRight: aggroB.clamp(-0.10, 0.10),
    );
  }
}
