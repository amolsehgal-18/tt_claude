import 'package:shared_preferences/shared_preferences.dart';

class TrophyManager {
  static const String _winsKey = 'trophy_wins';

  Future<void> addWin(String objectiveId) async {
    final prefs = await SharedPreferences.getInstance();
    List<String> wins = prefs.getStringList(_winsKey) ?? [];
    if (!wins.contains(objectiveId)) {
      wins.add(objectiveId);
      await prefs.setStringList(_winsKey, wins);
    }
  }

  Future<List<String>> getWins() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getStringList(_winsKey) ?? [];
  }

  Future<void> clearWins() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_winsKey);
  }
}