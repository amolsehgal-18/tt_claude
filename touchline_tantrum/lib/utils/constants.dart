import 'package:flutter/material.dart';

// BRAND COLORS
const Color kNeonYellow = Color(0xFFD4FF00);
const Color kElectricBlue = Color(0xFF00E5FF);
const Color kDeepRed = Color(0xFFFF4466);
const Color kSlateBlue = Color(0xFF3A4750);
const Color kSteelGray = Color(0xFF212121);
const Color kBlack = Color(0xFF0A0A0A);
const Color kGold = Color(0xFFFFD700);
const Color kPitchDark = Color(0xFF0F1A10);

const String kWinSound =
    "https://actions.google.com/sounds/v1/crowds/stadium_cheer.ogg";
const String kLossSound =
    "https://actions.google.com/sounds/v1/crowds/human_crowd_disappointed.ogg";

final Map<int, List<String>> kChronologicalPool = {
  0: [
    "10': Parking the bus already?",
    "15': Tactical masterclass or lucky guess?",
    "20': VAR check... just kidding",
    "25': That's not in the playbook!",
    "35': Hit the post! Physics 1, Striker 0",
    "40': Ref's having a mare"
  ],
  1: [
    "HT: Hairdryer treatment incoming",
    "HT: Drawing tactics on a napkin",
    "HT: 'Just score goals' - Manager's wisdom",
    "HT: Water bottles flying"
  ],
  2: [
    "70': Bringing on the big guns",
    "75': Time-wasting masterclass",
    "80': Keeper goes up for corner!",
    "85': Squeaky bum time",
    "90': Referee's watch is broken",
    "90+5': ABSOLUTE SCENES!"
  ]
};
