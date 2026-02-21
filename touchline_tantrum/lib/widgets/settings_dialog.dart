import 'package:flutter/material.dart';
import '../utils/constants.dart';
import '../utils/settings_manager.dart';

class SettingsDialog extends StatefulWidget {
  const SettingsDialog({super.key});

  @override
  State<SettingsDialog> createState() => _SettingsDialogState();
}

class _SettingsDialogState extends State<SettingsDialog> {
  late bool _musicEnabled;
  late bool _soundEnabled;
  late bool _hapticsEnabled;

  @override
  void initState() {
    super.initState();
    final settings = SettingsManager.instance;
    _musicEnabled = settings.musicEnabled;
    _soundEnabled = settings.soundEnabled;
    _hapticsEnabled = settings.hapticsEnabled;
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.black87,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: const BorderSide(color: kNeonYellow, width: 2),
      ),
      child: Padding(
        padding: const EdgeInsets.all(30),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              "SETTINGS",
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w900,
                color: kNeonYellow,
              ),
            ),
            const SizedBox(height: 30),
            _buildToggle(
              "MUSIC",
              _musicEnabled,
              Icons.music_note,
              (value) async {
                setState(() => _musicEnabled = value);
                await SettingsManager.instance.toggleMusic();
              },
            ),
            const SizedBox(height: 20),
            _buildToggle(
              "SOUND EFFECTS",
              _soundEnabled,
              Icons.volume_up,
              (value) async {
                setState(() => _soundEnabled = value);
                await SettingsManager.instance.toggleSound();
              },
            ),
            const SizedBox(height: 20),
            _buildToggle(
              "HAPTICS",
              _hapticsEnabled,
              Icons.vibration,
              (value) async {
                setState(() => _hapticsEnabled = value);
                await SettingsManager.instance.toggleHaptics();
              },
            ),
            const SizedBox(height: 30),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: kNeonYellow,
                padding:
                    const EdgeInsets.symmetric(horizontal: 40, vertical: 15),
              ),
              onPressed: () => Navigator.pop(context),
              child: const Text(
                "DONE",
                style: TextStyle(
                  color: Colors.black,
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildToggle(
    String label,
    bool value,
    IconData icon,
    Function(bool) onChanged,
  ) {
    return Row(
      children: [
        Icon(icon, color: kNeonYellow, size: 24),
        const SizedBox(width: 15),
        Expanded(
          child: Text(
            label,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        Switch(
          value: value,
          onChanged: onChanged,
          activeThumbColor: kNeonYellow,
          activeTrackColor: kNeonYellow.withValues(alpha: 0.5),
        ),
      ],
    );
  }
}
