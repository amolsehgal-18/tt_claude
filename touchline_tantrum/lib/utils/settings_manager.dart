import 'package:shared_preferences/shared_preferences.dart';

class SettingsManager {
  static final SettingsManager instance = SettingsManager._internal();
  factory SettingsManager() => instance;
  SettingsManager._internal();

  bool musicEnabled = true;
  bool soundEnabled = true;
  bool hapticsEnabled = true;

  Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    musicEnabled = prefs.getBool('music_enabled') ?? true;
    soundEnabled = prefs.getBool('sound_enabled') ?? true;
    hapticsEnabled = prefs.getBool('haptics_enabled') ?? true;
  }

  Future<void> save() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('music_enabled', musicEnabled);
    await prefs.setBool('sound_enabled', soundEnabled);
    await prefs.setBool('haptics_enabled', hapticsEnabled);
  }

  Future<void> toggleMusic() async {
    musicEnabled = !musicEnabled;
    await save();
  }

  Future<void> toggleSound() async {
    soundEnabled = !soundEnabled;
    await save();
  }

  Future<void> toggleHaptics() async {
    hapticsEnabled = !hapticsEnabled;
    await save();
  }
}
