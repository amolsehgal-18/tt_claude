class AudioManager {
  static final AudioManager instance = AudioManager._internal();
  factory AudioManager() => instance;
  AudioManager._internal();

  Future<void> initialize() async {}

  Future<void> playBackgroundMusic() async {
    // Audio disabled for stability
  }

  Future<void> stopBackgroundMusic() async {
    // Audio disabled for stability
  }

  Future<void> playSwipeSound(bool isLeft) async {
    // Audio disabled for stability
  }

  Future<void> playMatchSound(bool won) async {
    // Audio disabled for stability
  }

  Future<void> playButtonClick() async {
    // Audio disabled for stability
  }

  void dispose() {
    // Audio disabled for stability
  }
}
