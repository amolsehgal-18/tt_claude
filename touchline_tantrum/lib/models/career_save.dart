import '../models/team.dart';

class CareerSave {
  final String id;
  final String userId;
  final String teamName;
  final int logoSeed;
  final DateTime createdAt;
  final DateTime lastPlayedAt;

  // Game state
  final double boardTrust;
  final double fanSupport;
  final double dressingRoom;
  final double aggression;
  final int currentGW;
  final int matchesPlayed;
  final int matchesTotal;
  final List<Team> leagueTable;
  final int wildcards;
  final bool isSacked;

  // Saga info
  final String sagaId;
  final String sagaObjective;

  // Stats
  final int wins;
  final int losses;
  final int currentPosition;

  CareerSave({
    required this.id,
    required this.userId,
    required this.teamName,
    required this.logoSeed,
    required this.createdAt,
    required this.lastPlayedAt,
    required this.boardTrust,
    required this.fanSupport,
    required this.dressingRoom,
    required this.aggression,
    required this.currentGW,
    required this.matchesPlayed,
    required this.matchesTotal,
    required this.leagueTable,
    required this.wildcards,
    required this.isSacked,
    required this.sagaId,
    required this.sagaObjective,
    required this.wins,
    required this.losses,
    required this.currentPosition,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'userId': userId,
        'teamName': teamName,
        'logoSeed': logoSeed,
        'createdAt': createdAt.toIso8601String(),
        'lastPlayedAt': lastPlayedAt.toIso8601String(),
        'boardTrust': boardTrust,
        'fanSupport': fanSupport,
        'dressingRoom': dressingRoom,
        'aggression': aggression,
        'currentGW': currentGW,
        'matchesPlayed': matchesPlayed,
        'matchesTotal': matchesTotal,
        'leagueTable': leagueTable.map((t) => t.toJson()).toList(),
        'wildcards': wildcards,
        'isSacked': isSacked,
        'sagaId': sagaId,
        'sagaObjective': sagaObjective,
        'wins': wins,
        'losses': losses,
        'currentPosition': currentPosition,
      };

  factory CareerSave.fromJson(Map<String, dynamic> json) => CareerSave(
        id: json['id'] as String,
        userId: json['userId'] as String,
        teamName: json['teamName'] as String,
        logoSeed: json['logoSeed'] as int,
        createdAt: DateTime.parse(json['createdAt'] as String),
        lastPlayedAt: DateTime.parse(json['lastPlayedAt'] as String),
        boardTrust: json['boardTrust'] as double,
        fanSupport: json['fanSupport'] as double,
        dressingRoom: json['dressingRoom'] as double,
        aggression: json['aggression'] as double,
        currentGW: json['currentGW'] as int,
        matchesPlayed: json['matchesPlayed'] as int,
        matchesTotal: json['matchesTotal'] as int,
        leagueTable: (json['leagueTable'] as List)
            .map((t) => Team.fromJson(t as Map<String, dynamic>))
            .toList(),
        wildcards: json['wildcards'] as int,
        isSacked: json['isSacked'] as bool,
        sagaId: json['sagaId'] as String,
        sagaObjective: json['sagaObjective'] as String,
        wins: json['wins'] as int,
        losses: json['losses'] as int,
        currentPosition: json['currentPosition'] as int,
      );
}
