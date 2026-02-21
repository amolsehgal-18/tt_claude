class Team {
  String name;
  int points, iconSeed;
  double strength;

  Team(this.name, this.points, this.iconSeed, {this.strength = 0.5});

  Map<String, dynamic> toJson() => {
        'name': name,
        'points': points,
        'iconSeed': iconSeed,
        'strength': strength,
      };

  factory Team.fromJson(Map<String, dynamic> json) => Team(
        json['name'] as String,
        json['points'] as int,
        json['iconSeed'] as int,
        strength: (json['strength'] as num).toDouble(),
      );
}
