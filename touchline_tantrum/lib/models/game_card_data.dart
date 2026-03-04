class GameCardData {
  final String text, leftOption, rightOption;

  // Left option impacts (applied when player swipes left / taps left button)
  final int boardImpactLeft, fanImpactLeft, dressingRoomImpactLeft;
  final double aggressionShiftLeft;

  // Right option impacts (applied when player swipes right / taps right button)
  final int boardImpactRight, fanImpactRight, dressingRoomImpactRight;
  final double aggressionShiftRight;

  final bool isMatchResult;

  /// Standard constructor for CSV-loaded cards.
  /// The right option automatically mirrors (negates) the left option impacts.
  GameCardData(
    this.text,
    this.leftOption,
    this.rightOption,
    int boardImpact,
    int fanImpact,
    int dressingRoomImpact,
    double aggressionShift, {
    this.isMatchResult = false,
  })  : boardImpactLeft = boardImpact,
        fanImpactLeft = fanImpact,
        dressingRoomImpactLeft = dressingRoomImpact,
        aggressionShiftLeft = aggressionShift,
        boardImpactRight = -boardImpact,
        fanImpactRight = -fanImpact,
        dressingRoomImpactRight = -dressingRoomImpact,
        aggressionShiftRight = -aggressionShift;

  /// Named constructor for AI-generated cards with independent per-option impacts.
  /// Each option can have entirely different stat effects — no mirroring.
  GameCardData.withIndependentImpacts({
    required this.text,
    required this.leftOption,
    required this.rightOption,
    required this.boardImpactLeft,
    required this.fanImpactLeft,
    required this.dressingRoomImpactLeft,
    required this.aggressionShiftLeft,
    required this.boardImpactRight,
    required this.fanImpactRight,
    required this.dressingRoomImpactRight,
    required this.aggressionShiftRight,
    this.isMatchResult = false,
  });
}
