class ActiveGameSession {
  final String id, userName, objective;
  final int totalMatches, userLogo, startWeek;
  ActiveGameSession(
      {required this.id,
      required this.userName,
      required this.objective,
      required this.totalMatches,
      required this.userLogo,
      required this.startWeek});

  Map<String, dynamic> toJson() => {
        'id': id,
        'userName': userName,
        'objective': objective,
        'totalMatches': totalMatches,
        'userLogo': userLogo,
        'startWeek': startWeek,
      };

  factory ActiveGameSession.fromJson(Map<String, dynamic> json) =>
      ActiveGameSession(
        id: json['id'] as String,
        userName: json['userName'] as String,
        objective: json['objective'] as String,
        totalMatches: json['totalMatches'] as int,
        userLogo: json['userLogo'] as int,
        startWeek: json['startWeek'] as int,
      );
}
