import 'dart:async';

class AIService {
  Future<String> _generateContent(String prompt) async {
    await Future.delayed(const Duration(milliseconds: 500));

    // Simulate a wider variety of responses based on the new prompt structure
    if (prompt.contains("Create a unique scenario")) {
      final themes = ["Player Ego", "Board Pressure", "Fan Relations", "Media Spotlight", "Club Finances"];
      final selectedTheme = themes.firstWhere((t) => prompt.contains(t), orElse: () => "General");

      final responses = {
        "Player Ego": [
          "Your star striker demands a new contract with a wage that would break your club's structure.;Give in to his demands to keep him happy;Refuse and risk him demanding a transfer;-15,5,10,0.05;10,-10,-15,-0.05",
          "A veteran player publicly criticizes your tactics after a poor result.;Fine the player and drop him for the next match;Have a private one-on-one to clear the air;-5,-5,10,0.05;5,5,-10,-0.05"
        ],
        "Board Pressure": [
          "The board insists you sign a specific, aging foreign player for marketing reasons.;Sign the player to please the board;Argue for a younger, better player who fits your system;-10,15,-5,0.0;10,-5,-5,-0.05",
          "The Chairman's son has been offered a trial. He is, to be blunt, terrible.;Offer him a short-term youth contract;Politely explain he isn't ready for professional football;-15,0,5,0.0;20,-5,-5,-0.1"
        ],
        "Fan Relations": [
          "A prominent fan group is protesting high ticket prices.;Promise to freeze prices for next season;Release a statement explaining the club's financial needs;-5,15,-5,0.0;5,-20,5,0.0"
        ],
        "Media Spotlight": [
          "A tabloid newspaper has published photos of you on a night out before a big game.;Hold a press conference to apologize and refocus;Ignore the story and maintain a dignified silence;-5,-10,5,0.05;5,5,-5,-0.05"
        ],
        "General": [
          "The club's new crypto sponsor is demanding you feature their logo more prominently. The fans hate it.;Agree and wear a giant bitcoin on your training top;Politely decline and risk the sponsorship deal;-10,15,-5,0.1;10,-20,5,-0.05"
        ]
      };

      final responseList = responses[selectedTheme] ?? responses["General"]!;
      // To avoid using dart:math, we'll just return the first element for this simulation
      return responseList[0];
    } else if (prompt.contains("Generate 3 short, dramatic commentary lines")) {
      return "The whistle blows and we are underway! • A crunching tackle near the halfway line, the ref keeps his cards in his pocket. • It's all over, a hard-fought victory on the road!";
    } else if (prompt.contains("Act as the Chairman")) {
      return "The board is bitterly disappointed with this season's performance. Finishing so low in the table is unacceptable, and the dwindling attendance figures have not gone unnoticed. We will be conducting a full review of the club's management structure.";
    }
    return "No response generated.";
  }

  Future<String> generateScenario({
    required double fanSupport,
    required double boardTrust,
    required double dressingRoom,
    required bool lastMatchWon,
    required String teamName,
    required int leaguePosition,
    required String theme,
    required List<String> recentScenarios,
    required List<String> existingScenarios,
  }) async {
    final prompt = '''
    You are a football management game designer. Create a unique scenario for the manager of $teamName.
    The chosen theme for this scenario is: **$theme**.

    Current context:
    - League Position: $leaguePosition
    - Fan Support: ${(fanSupport * 100).toInt()}%
    - Board Trust: ${(boardTrust * 100).toInt()}%
    - Dressing Room Morale: ${(dressingRoom * 100).toInt()}%
    - Last Match Result: ${lastMatchWon ? "Won" : "Lost/Drew"}

    **Crucially, do not generate a scenario similar to any of the following recent ones:**
    ${recentScenarios.map((s) => "- $s").join('\n')}

    Your task is to create a compelling dilemma based on the theme and context.
    Return a single string with each part separated by a semicolon, in this exact format:
    Scenario Text;Option A;Option B;BoardA,FanA,SquadA,AggroA;BoardB,FanB,SquadB,AggroB
    
    - The impact values must be integers between -20 and 20.
    - The Aggro (aggression) values must be decimals between -0.1 and 0.1.
    ''';

    return await _generateContent(prompt);
  }

  Future<String> generateMatchCommentary({
    required String teamName,
    required String opponentName,
    required double teamStrength,
    required double opponentStrength,
  }) async {
    final prompt = '''
    You are an excited football commentator. Generate 3 short, dramatic commentary lines for a match between $teamName and $opponentName.
    $teamName's strength is $teamStrength and $opponentName's is $opponentStrength.
    The commentary should reflect this power dynamic.

    Return a single string with the three lines separated by ' • '.
    ''';
    return await _generateContent(prompt);
  }

  Future<String> generateEndOfSeasonFeedback({
    required int finalPosition,
    required int objective,
    required double fanSupport,
    required bool wasSacked,
  }) async {
    final prompt = '''
    Act as the Chairman of a football club. I was the manager this season.
    
    Here is a summary of my performance:
    - Final League Position: $finalPosition
    - Objective: Finish in the top $objective
    - Final Fan Support: ${(fanSupport * 100).toInt()}%
    - My final status: ${wasSacked ? "Sacked" : "Season Ended"}

    Write ONE short, formal, and emotionally charged "Board Verdict" statement for me based on my performance.
    Do not write separate verdicts for fans or squad.
    ''';
    return await _generateContent(prompt);
  }
}
