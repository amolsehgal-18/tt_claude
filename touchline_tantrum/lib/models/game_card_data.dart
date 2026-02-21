class GameCardData {
  final String text, leftOption, rightOption;
  final int boardImpact, fanImpact, dressingRoomImpact;
  final double aggressionShift;
  final bool isMatchResult;
  GameCardData(this.text, this.leftOption, this.rightOption, this.boardImpact,
      this.fanImpact, this.dressingRoomImpact, this.aggressionShift,
      {this.isMatchResult = false});
}
