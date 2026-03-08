
/**
 * @fileOverview Scenario data for Touchline Tantrum.
 * 
 * Each card defines impacts for:
 * 1. boardImpact: Integer (e.g. 10 = +10% Board Support)
 * 2. fanImpact: Integer (e.g. -5 = -5% Fan Support)
 * 3. dressingRoomImpact: Integer (e.g. 8 = +8% Player Morale)
 * 4. aggressionImpact: Float (e.g. 0.15 = +15% Tactical Aggression)
 */

export interface ScenarioCardData {
  id: string;
  scenarioText: string;
  leftOptionText: string;
  rightOptionText: string;
  boardImpact: number;
  fanImpact: number;
  dressingRoomImpact: number;
  aggressionImpact: number;
  imageCategory: string;
  triggerCondition: string;
  gameCategory: string;
  isBreaking: boolean;
}

export const SCENARIO_CARDS: ScenarioCardData[] = [
  {
    id: "sc_001",
    scenarioText: "Your star striker refuses to celebrate after scoring, hinting at unrest.",
    leftOptionText: "Drop him for the next match.",
    rightOptionText: "Praise him publicly.",
    boardImpact: -8,
    fanImpact: 2,
    dressingRoomImpact: 5,
    aggressionImpact: 0.15,
    imageCategory: "player_ego",
    triggerCondition: "performance_high",
    gameCategory: "locker",
    isBreaking: false
  },
  {
    id: "sc_002",
    scenarioText: "The team's veteran leader criticizes your tactics to the media.",
    leftOptionText: "Strip him of the captaincy.",
    rightOptionText: "Call a team meeting.",
    boardImpact: -5,
    fanImpact: -3,
    dressingRoomImpact: 10,
    aggressionImpact: 0.1,
    imageCategory: "player_ego",
    triggerCondition: "performance_low",
    gameCategory: "locker",
    isBreaking: false
  },
  {
    id: "sc_003",
    scenarioText: "A young prospect arrives late to training for the third time this month.",
    leftOptionText: "Fine him two weeks' wages.",
    rightOptionText: "Make him run extra laps.",
    boardImpact: 0,
    fanImpact: -2,
    dressingRoomImpact: 5,
    aggressionImpact: 0.05,
    imageCategory: "training_ground",
    triggerCondition: "any_time",
    gameCategory: "training",
    isBreaking: false
  },
  {
    id: "sc_004",
    scenarioText: "The board demands you play their expensive new signing.",
    leftOptionText: "Stick with your in-form player.",
    rightOptionText: "Start him despite poor form.",
    boardImpact: 10,
    fanImpact: -8,
    dressingRoomImpact: 2,
    aggressionImpact: -0.05,
    imageCategory: "board_pressure",
    triggerCondition: "new_signing",
    gameCategory: "press",
    isBreaking: false
  },
  {
    id: "sc_005",
    scenarioText: "Two key players clash over a penalty decision during a match.",
    leftOptionText: "Hold a team vote on penalty duties.",
    rightOptionText: "Let the captain decide.",
    boardImpact: -3,
    fanImpact: 0,
    dressingRoomImpact: -8,
    aggressionImpact: 0.12,
    imageCategory: "player_ego",
    triggerCondition: "match_day",
    gameCategory: "stadium",
    isBreaking: false
  },
  {
    id: "sc_006",
    scenarioText: "Your goalkeeper concedes a soft goal and blames the defenders.",
    leftOptionText: "Defend your defenders.",
    rightOptionText: "Make him apologize privately.",
    boardImpact: -2,
    fanImpact: 5,
    dressingRoomImpact: 0,
    aggressionImpact: 0.08,
    imageCategory: "training_ground",
    triggerCondition: "performance_low",
    gameCategory: "training",
    isBreaking: false
  },
  {
    id: "sc_007",
    scenarioText: "The team's fitness coach recommends dropping an aging star.",
    leftOptionText: "Keep playing your leader.",
    rightOptionText: "Follow medical advice.",
    boardImpact: -5,
    fanImpact: 8,
    dressingRoomImpact: 2,
    aggressionImpact: -0.1,
    imageCategory: "training_ground",
    triggerCondition: "player_injury",
    gameCategory: "training",
    isBreaking: false
  },
  {
    id: "sc_008",
    scenarioText: "A player is caught partying two nights before a crucial derby.",
    leftOptionText: "Give him a stern warning.",
    rightOptionText: "Suspend him for three matches.",
    boardImpact: -10,
    fanImpact: 5,
    dressingRoomImpact: 8,
    aggressionImpact: 0.2,
    imageCategory: "player_ego",
    triggerCondition: "match_important",
    gameCategory: "locker",
    isBreaking: false
  },
  {
    id: "sc_009",
    scenarioText: "The board sets unrealistic league position targets mid-season.",
    leftOptionText: "Push back citing squad limits.",
    rightOptionText: "Publicly commit to the goal.",
    boardImpact: -15,
    fanImpact: 10,
    dressingRoomImpact: 2,
    aggressionImpact: 0.05,
    imageCategory: "board_pressure",
    triggerCondition: "performance_low",
    gameCategory: "press",
    isBreaking: false
  },
  {
    id: "sc_010",
    scenarioText: "Your assistant manager leaks team selection to the press.",
    leftOptionText: "Handle it internally.",
    rightOptionText: "Demand his resignation.",
    boardImpact: -8,
    fanImpact: 0,
    dressingRoomImpact: -2,
    aggressionImpact: 0.15,
    imageCategory: "board_pressure",
    triggerCondition: "any_time",
    gameCategory: "press",
    isBreaking: false
  },
  {
    id: "sc_011",
    scenarioText: "Players complain the training schedule is too intense.",
    leftOptionText: "Reduce the intensity.",
    rightOptionText: "Increase intensity.",
    boardImpact: 5,
    fanImpact: -5,
    dressingRoomImpact: 5,
    aggressionImpact: 0.25,
    imageCategory: "training_ground",
    triggerCondition: "performance_low",
    gameCategory: "training",
    isBreaking: false
  },
  {
    id: "sc_012",
    scenarioText: "A financial audit reveals the club has been hiding massive debts.",
    leftOptionText: "Support board decisions.",
    rightOptionText: "Demand resignations.",
    boardImpact: -20,
    fanImpact: 5,
    dressingRoomImpact: -2,
    aggressionImpact: 0.1,
    imageCategory: "finance",
    triggerCondition: "financial_crisis",
    gameCategory: "press",
    isBreaking: true
  },
  {
    id: "sc_013",
    scenarioText: "A top-tier European giant is scouting your most loyal player.",
    leftOptionText: "Set an impossible price tag.",
    rightOptionText: "Ask the player to stay.",
    boardImpact: 10,
    fanImpact: -5,
    dressingRoomImpact: -10,
    aggressionImpact: 0.05,
    imageCategory: "player_ego",
    triggerCondition: "performance_high",
    gameCategory: "locker",
    isBreaking: false
  },
  {
    id: "sc_014",
    scenarioText: "Local residents are protesting against the proposed stadium expansion.",
    leftOptionText: "Meet with community leaders.",
    rightOptionText: "Ignore the noise.",
    boardImpact: 12,
    fanImpact: -10,
    dressingRoomImpact: 0,
    aggressionImpact: -0.05,
    imageCategory: "board_pressure",
    triggerCondition: "any_time",
    gameCategory: "stadium",
    isBreaking: false
  },
  {
    id: "sc_015",
    scenarioText: "A freak flood has damaged the training pitch ahead of a big game.",
    leftOptionText: "Rent a nearby facility.",
    rightOptionText: "Train on the muddy pitch.",
    boardImpact: -8,
    fanImpact: 0,
    dressingRoomImpact: 5,
    aggressionImpact: 0.15,
    imageCategory: "training_ground",
    triggerCondition: "any_time",
    gameCategory: "training",
    isBreaking: false
  },
  {
    id: "sc_016",
    scenarioText: "The club's legendary former manager criticizes your tactical rigidity.",
    leftOptionText: "Defend your philosophy.",
    rightOptionText: "Acknowledge his wisdom.",
    boardImpact: -5,
    fanImpact: -15,
    dressingRoomImpact: 5,
    aggressionImpact: 0.2,
    imageCategory: "press",
    triggerCondition: "performance_low",
    gameCategory: "press",
    isBreaking: false
  },
  {
    id: "sc_017",
    scenarioText: "A rival manager calls your team 'lucky' after your last win.",
    leftOptionText: "Fire back in the press.",
    rightOptionText: "Take the high road.",
    boardImpact: 0,
    fanImpact: 12,
    dressingRoomImpact: 8,
    aggressionImpact: 0.3,
    imageCategory: "press",
    triggerCondition: "performance_high",
    gameCategory: "press",
    isBreaking: false
  },
  {
    id: "sc_018",
    scenarioText: "The youth academy is producing zero talent, saving the board millions.",
    leftOptionText: "Demand more investment.",
    rightOptionText: "Accept the budget cut.",
    boardImpact: 15,
    fanImpact: -12,
    dressingRoomImpact: -5,
    aggressionImpact: -0.1,
    imageCategory: "board_pressure",
    triggerCondition: "any_time",
    gameCategory: "training",
    isBreaking: false
  },
  {
    id: "sc_019",
    scenarioText: "A dressing room leak reveals you are planning to sell the captain.",
    leftOptionText: "Deny everything.",
    rightOptionText: "Confirm the rumors.",
    boardImpact: 10,
    fanImpact: -20,
    dressingRoomImpact: -15,
    aggressionImpact: 0.1,
    imageCategory: "locker",
    triggerCondition: "any_time",
    gameCategory: "locker",
    isBreaking: true
  },
  {
    id: "sc_020",
    scenarioText: "The fans are planning a banner protest at the 20th minute.",
    leftOptionText: "Appeal for unity via Twitter.",
    rightOptionText: "Let them vent.",
    boardImpact: -10,
    fanImpact: -5,
    dressingRoomImpact: -5,
    aggressionImpact: 0.05,
    imageCategory: "fans",
    triggerCondition: "performance_low",
    gameCategory: "stadium",
    isBreaking: true
  },
  {
    id: "sc_021",
    scenarioText: "A mid-table rival offers a swap deal for your unhappy winger.",
    leftOptionText: "Accept the trade.",
    rightOptionText: "Demand cash only.",
    boardImpact: 5,
    fanImpact: 0,
    dressingRoomImpact: 5,
    aggressionImpact: 0.05,
    imageCategory: "player_ego",
    triggerCondition: "any_time",
    gameCategory: "press",
    isBreaking: false
  },
  {
    id: "sc_022",
    scenarioText: "The kit sponsor is unhappy with the team's lack of media exposure.",
    leftOptionText: "Do extra press conferences.",
    rightOptionText: "Ignore and focus on training.",
    boardImpact: 10,
    fanImpact: -5,
    dressingRoomImpact: -5,
    aggressionImpact: -0.05,
    imageCategory: "board_pressure",
    triggerCondition: "any_time",
    gameCategory: "press",
    isBreaking: false
  },
  {
    id: "sc_023",
    scenarioText: "Your scouts find a hidden gem in the lower leagues for cheap.",
    leftOptionText: "Sign him immediately.",
    rightOptionText: "Monitor for another month.",
    boardImpact: 8,
    fanImpact: 10,
    dressingRoomImpact: 2,
    aggressionImpact: 0.05,
    imageCategory: "scouting",
    triggerCondition: "any_time",
    gameCategory: "locker",
    isBreaking: false
  },
  {
    id: "sc_024",
    scenarioText: "A player's agent is making noise in the press about a new contract.",
    leftOptionText: "Offer an extension.",
    rightOptionText: "Tell him to wait.",
    boardImpact: -5,
    fanImpact: -5,
    dressingRoomImpact: 10,
    aggressionImpact: -0.1,
    imageCategory: "player_ego",
    triggerCondition: "any_time",
    gameCategory: "press",
    isBreaking: false
  },
  {
    id: "sc_025",
    scenarioText: "The medical department warns of a potential fatigue crisis.",
    leftOptionText: "Rotate the entire squad.",
    rightOptionText: "Play the strongest XI anyway.",
    boardImpact: -5,
    fanImpact: 8,
    dressingRoomImpact: 12,
    aggressionImpact: -0.2,
    imageCategory: "training_ground",
    triggerCondition: "any_time",
    gameCategory: "training",
    isBreaking: false
  },
  {
    id: "sc_026",
    scenarioText: "An ex-player releases a tell-all book criticizing your leadership.",
    leftOptionText: "Sue for defamation.",
    rightOptionText: "Laugh it off.",
    boardImpact: -5,
    fanImpact: -10,
    dressingRoomImpact: 5,
    aggressionImpact: 0.1,
    imageCategory: "press",
    triggerCondition: "any_time",
    gameCategory: "press",
    isBreaking: false
  },
  {
    id: "sc_027",
    scenarioText: "A heavy defeat leads to calls for a change in tactical philosophy.",
    leftOptionText: "Stick to your guns.",
    rightOptionText: "Switch to a defensive block.",
    boardImpact: -10,
    fanImpact: 5,
    dressingRoomImpact: -5,
    aggressionImpact: -0.25,
    imageCategory: "board_pressure",
    triggerCondition: "performance_low",
    gameCategory: "stadium",
    isBreaking: true
  },
  {
    id: "sc_028",
    scenarioText: "The board wants to sell stadium naming rights to a betting company.",
    leftOptionText: "Publicly oppose the deal.",
    rightOptionText: "Stay neutral.",
    boardImpact: -15,
    fanImpact: 20,
    dressingRoomImpact: 0,
    aggressionImpact: 0,
    imageCategory: "finance",
    triggerCondition: "any_time",
    gameCategory: "stadium",
    isBreaking: true
  },
  {
    id: "sc_029",
    scenarioText: "A legendary veteran wants to transition into a coaching role.",
    leftOptionText: "Offer him a staff contract.",
    rightOptionText: "Tell him to keep playing.",
    boardImpact: 5,
    fanImpact: 5,
    dressingRoomImpact: 10,
    aggressionImpact: -0.05,
    imageCategory: "locker",
    triggerCondition: "any_time",
    gameCategory: "locker",
    isBreaking: false
  },
  {
    id: "sc_030",
    scenarioText: "The team bus is stuck in traffic, delaying the match kick-off.",
    leftOptionText: "Demand a postponement.",
    rightOptionText: "Rush the warm-up.",
    boardImpact: -5,
    fanImpact: 0,
    dressingRoomImpact: -10,
    aggressionImpact: 0.15,
    imageCategory: "stadium",
    triggerCondition: "any_time",
    gameCategory: "stadium",
    isBreaking: false
  }
];
